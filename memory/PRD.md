# BuildLedger — Product Requirements

## Original Problem Statement
Inventory Management System for a BTech Civil Engineering project. Track
construction materials, assign site tasks, log every stock movement, and reserve
room for future YOLOv5 material counting. Strict tech stack requirement: MERN
(MongoDB, Express, React, Node.js) with Tailwind and JWT auth.

## Stack
- Frontend: React 19 + Tailwind + Shadcn/UI + React Router + Axios
- Backend: Node.js + Express 5 + Mongoose 8 (at `/app/backend-node`)
- Bridge: FastAPI proxy at `/app/backend/server.py` (spawns Node child on port
  4000 and reverse-proxies `/api/*` because supervisor is read-only)
- Database: MongoDB (`test_database`)
- Auth: JWT + bcryptjs + httpOnly cookie fallback

## User Personas
- **Admin** – full control: user management, roles, task creation, settings, activity feed
- **Storekeeper** – material CRUD + record stock movements + create tasks
- **Engineer** – view materials, see own tasks, advance task status

## Core Requirements (static)
1. Admin control panel (users, roles, activity, site settings)
2. Task assignment (Admin/Storekeeper assigns → Engineer sees own tasks)
3. ABC material classification (A/B/C priority tags)
4. Transaction ledger (Inbound / Outbound, optional link to task)
5. Auth with role gating on every write endpoint

## Implemented (2026-02)
- MERN backend re-architected in `/app/backend-node` (models, routes, controllers, services, schemas)
- FastAPI bridge in `/app/backend/server.py` that boots Node and reverse-proxies transparently
- Auth: `/register`, `/login`, `/logout`, `/me`, `/claim-first-admin`
- Admin routes: `/users` CRUD, role change, active toggle, `/activity`, `/settings`
- Materials: search, ABC filter, low-stock filter, create, delete, CSV export
- Tasks: assignment with role gating, engineer-only view of own tasks, status advance
- Transactions: Inbound/Outbound movements with automatic stock update, optional linked task
- Dashboard: aggregated metrics (materials, low stock, open tasks, movements)
- YOLOv5 placeholder page (MOCKED / FUTURE INTEGRATION)
- Frontend refactored from single-file to `src/pages/` and `src/components/`

## Seed accounts (see `/app/memory/test_credentials.md`)
- admin@buildledger.dev / Admin@1234 (Admin)
- store@buildledger.dev / Store@1234 (Storekeeper)
- engineer@buildledger.dev / Engineer@1234 (Engineer)

## Backlog / Next
- P1: In-place material edit modal (stock top-up, threshold adjustment)
- P1: Dashboard trend charts (weekly inbound vs outbound)
- P1: Filter transactions by material and date range
- P2: Real YOLOv5 endpoint once the trained model is provided
- P2: Email invitation delivery for new users (currently temp password shown to admin only)
