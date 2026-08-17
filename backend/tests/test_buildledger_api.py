"""
BuildLedger MERN backend regression suite.

Covers auth (login/register/me/logout), materials CRUD + filters, tasks
role-scoped listing + status updates, transactions inbound/outbound with stock
mutation, admin user/settings/activity endpoints, YOLO placeholder, and
role-gating enforcement (Engineer 403s on write endpoints and admin routes).
"""

import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@buildledger.dev", "password": "Admin@1234"}
STORE = {"email": "store@buildledger.dev", "password": "Store@1234"}
ENGR = {"email": "engineer@buildledger.dev", "password": "Engineer@1234"}


# ---------- session helpers ----------
def _session(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed for {creds['email']}: {r.status_code} {r.text}"
    token = r.json().get("token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="session")
def admin():
    return _session(ADMIN)


@pytest.fixture(scope="session")
def store():
    return _session(STORE)


@pytest.fixture(scope="session")
def engineer():
    return _session(ENGR)


# ---------- health ----------
class TestHealth:
    def test_root_message(self):
        r = requests.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["message"] == "BuildLedger Node API online"
        assert data["stack"] == "MERN"


# ---------- auth ----------
class TestAuth:
    def test_admin_login(self):
        r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN["email"]
        assert data["role"] == "Admin"
        assert isinstance(data.get("token"), str) and len(data["token"]) > 20

    def test_invalid_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrong"}, timeout=10)
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_me_returns_admin(self, admin):
        r = admin.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 200
        assert r.json()["role"] == "Admin"

    def test_register_new_user_defaults_engineer(self):
        email = f"TEST_reg_{uuid.uuid4().hex[:8]}@buildledger.dev"
        r = requests.post(
            f"{API}/auth/register",
            json={"email": email, "password": "TestPass@123", "name": "Reg Tester"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"].lower() == email.lower()
        assert data["role"] == "Engineer"
        assert "token" in data

    def test_logout(self, admin):
        s = _session(ADMIN)
        r = s.post(f"{API}/auth/logout", timeout=10)
        assert r.status_code == 200


# ---------- materials ----------
class TestMaterials:
    def test_seeded_materials_present(self, admin):
        r = admin.get(f"{API}/materials", timeout=10)
        assert r.status_code == 200
        skus = {m["sku"]: m for m in r.json()}
        for sku in ("STL-001", "CEM-001", "BRK-001", "SND-001"):
            assert sku in skus, f"Missing seeded SKU {sku}. Found: {list(skus)}"
        # No mongo _id leakage
        for m in r.json():
            assert "_id" not in m
            assert "id" in m
            assert m["priorityTag"] in ("A", "B", "C")

    def test_filter_by_priority_a(self, admin):
        r = admin.get(f"{API}/materials", params={"priorityTag": "A"}, timeout=10)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        for m in items:
            assert m["priorityTag"] == "A"

    def test_low_stock_filter(self, admin):
        r = admin.get(f"{API}/materials", params={"lowStock": "true"}, timeout=10)
        assert r.status_code == 200

    def test_admin_creates_and_deletes_material(self, admin):
        payload = {
            "sku": f"TEST-{uuid.uuid4().hex[:6].upper()}",
            "name": "TEST_Material",
            "unit": "kg",
            "currentStock": 100,
            "minimumThreshold": 10,
            "unitCost": 5.0,
            "priorityTag": "B",
        }
        r = admin.post(f"{API}/materials", json=payload, timeout=10)
        assert r.status_code == 201, r.text
        created = r.json()
        assert created["sku"] == payload["sku"]
        mid = created["id"]

        # Verify persistence via list
        rlist = admin.get(f"{API}/materials", params={"search": payload["sku"]}, timeout=10)
        assert any(m["id"] == mid for m in rlist.json())

        # Delete
        rd = admin.delete(f"{API}/materials/{mid}", timeout=10)
        assert rd.status_code == 200

    def test_engineer_cannot_create_material(self, engineer):
        r = engineer.post(
            f"{API}/materials",
            json={
                "sku": "TEST-DENY",
                "name": "denied",
                "unit": "kg",
                "currentStock": 1,
                "minimumThreshold": 1,
                "unitCost": 1.0,
                "priorityTag": "C",
            },
            timeout=10,
        )
        assert r.status_code == 403


# ---------- transactions / stock mutation ----------
class TestTransactions:
    def test_inbound_then_outbound_updates_stock(self, admin):
        # find steel rebar
        r = admin.get(f"{API}/materials", params={"search": "STL-001"}, timeout=10)
        steel = next(m for m in r.json() if m["sku"] == "STL-001")
        start = steel["currentStock"]

        # Inbound +10
        rin = admin.post(
            f"{API}/transactions",
            json={
                "materialId": steel["id"],
                "transactionType": "Inbound",
                "quantity": 10,
                "notes": "TEST_inbound",
            },
            timeout=15,
        )
        assert rin.status_code == 200, rin.text
        assert rin.json()["newStock"] == start + 10

        # Outbound -5
        rout = admin.post(
            f"{API}/transactions",
            json={
                "materialId": steel["id"],
                "transactionType": "Outbound",
                "quantity": 5,
                "notes": "TEST_outbound",
            },
            timeout=15,
        )
        assert rout.status_code == 200, rout.text
        assert rout.json()["newStock"] == start + 5

        # Verify persistence
        r2 = admin.get(f"{API}/materials", params={"search": "STL-001"}, timeout=10)
        steel2 = next(m for m in r2.json() if m["sku"] == "STL-001")
        assert steel2["currentStock"] == start + 5

    def test_list_transactions(self, admin):
        r = admin.get(f"{API}/transactions", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_engineer_cannot_create_transaction(self, engineer):
        r = engineer.post(
            f"{API}/transactions",
            json={"materialId": "000000000000000000000000", "transactionType": "Inbound", "quantity": 1},
            timeout=10,
        )
        assert r.status_code == 403


# ---------- tasks ----------
class TestTasks:
    def test_admin_creates_task_for_engineer_and_engineer_sees_it(self, admin, engineer):
        # find engineer id via /api/users (admin only)
        rusers = admin.get(f"{API}/users", timeout=10)
        assert rusers.status_code == 200
        eng = next(u for u in rusers.json() if u["email"] == ENGR["email"])

        payload = {
            "taskName": f"TEST_task_{uuid.uuid4().hex[:6]}",
            "assignedTo": eng["id"],
        }
        r = admin.post(f"{API}/tasks", json=payload, timeout=10)
        assert r.status_code == 201, r.text
        task = r.json()
        assert task["assignedTo"] == eng["id"]
        assert task["assignedName"] == eng["name"]
        tid = task["id"]

        # Engineer sees only own tasks
        re = engineer.get(f"{API}/tasks", timeout=10)
        assert re.status_code == 200
        my_tasks = re.json()
        assert any(t["id"] == tid for t in my_tasks)
        for t in my_tasks:
            assert t["assignedTo"] == eng["id"]

        # Engineer advances status
        for status in ("In Progress", "Completed"):
            rs = engineer.patch(f"{API}/tasks/{tid}/status", json={"status": status}, timeout=10)
            assert rs.status_code == 200, f"{status}: {rs.text}"

    def test_engineer_cannot_create_task(self, engineer):
        r = engineer.post(
            f"{API}/tasks",
            json={"taskName": "x", "assignedTo": "000000000000000000000000"},
            timeout=10,
        )
        assert r.status_code == 403


# ---------- role gating on admin endpoints ----------
class TestRoleGating:
    def test_engineer_cannot_list_users(self, engineer):
        r = engineer.get(f"{API}/users", timeout=10)
        assert r.status_code == 403

    def test_engineer_can_read_dashboard(self, engineer):
        r = engineer.get(f"{API}/dashboard", timeout=10)
        assert r.status_code == 200

    def test_engineer_can_read_materials(self, engineer):
        r = engineer.get(f"{API}/materials", timeout=10)
        assert r.status_code == 200

    def test_engineer_can_read_transactions(self, engineer):
        r = engineer.get(f"{API}/transactions", timeout=10)
        assert r.status_code == 200

    def test_engineer_yolo_status(self, engineer):
        r = engineer.get(f"{API}/yolo/status", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data.get("active") is False


# ---------- admin People / Settings / Activity ----------
class TestAdminPanel:
    def test_admin_creates_storekeeper_user_and_changes_role(self, admin):
        email = f"TEST_person_{uuid.uuid4().hex[:6]}@buildledger.dev"
        r = admin.post(
            f"{API}/users",
            json={"email": email, "password": "TestPass@123", "name": "TEST Person", "role": "Storekeeper"},
            timeout=15,
        )
        assert r.status_code == 201, r.text
        u = r.json()
        assert u["role"] == "Storekeeper"
        uid = u["id"]

        rr = admin.patch(f"{API}/users/{uid}/role", json={"role": "Engineer"}, timeout=10)
        assert rr.status_code == 200

        # Toggle active off then back on
        ra = admin.patch(f"{API}/users/{uid}/active", json={}, timeout=10)
        assert ra.status_code == 200
        assert ra.json()["active"] in (False, True)
        ra2 = admin.patch(f"{API}/users/{uid}/active", json={}, timeout=10)
        assert ra2.status_code == 200

    def test_admin_cannot_toggle_self(self, admin):
        me = admin.get(f"{API}/auth/me", timeout=10).json()
        r = admin.patch(f"{API}/users/{me['id']}/active", json={}, timeout=10)
        assert r.status_code == 400

    def test_settings_persist(self, admin):
        payload = {
            "siteName": "North Block",
            "siteCode": "SITE 04",
            "projectNote": f"TEST_note_{uuid.uuid4().hex[:6]}",
        }
        r = admin.put(f"{API}/settings", json=payload, timeout=10)
        assert r.status_code == 200
        rg = admin.get(f"{API}/settings", timeout=10)
        assert rg.status_code == 200
        assert rg.json()["projectNote"] == payload["projectNote"]

    def test_activity_feed(self, admin):
        r = admin.get(f"{API}/activity", timeout=10)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        if items:
            first = items[0]
            assert "actorName" in first or "actor" in first or "action" in first
