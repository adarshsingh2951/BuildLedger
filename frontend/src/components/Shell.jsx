import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, Moon, Sun, X, Users, Activity, Settings } from "lucide-react";
import { api } from "@/lib/api";
import { PRIMARY_NAV, PAGE_TITLES } from "@/lib/nav";
import ProfileDrawer from "@/components/profileDrawer";

export function Shell({ auth, setAuth, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");

  const [siteData, setSiteData] = useState({ siteName: "North Block", siteCode: "SITE 04", projectNote: "" });
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const load = () =>
      api.get("/settings")
        .then((response) => { if (response.data) setSiteData(response.data); })
        .catch((error) => console.error(error));
    load();
    window.addEventListener("buildledger:settings-updated", load);
    return () => window.removeEventListener("buildledger:settings-updated", load);
  }, [location.pathname]);

  const logout = async () => {
    await api.post("/auth/logout");
    setAuth({ user: false, ready: true });
    navigate("/login");
  };

  const isActive = (to) => location.pathname === to;
  const pageTitle = PAGE_TITLES[location.pathname] || "Overview";

  return (
    <div className="shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span className="brand-mark">B</span>
          <span>BUILD<span>LEDGER</span></span>
          <button className="icon-btn mobile-only" data-testid="close-menu-button" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="site-label">
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
            {siteData.siteName.toUpperCase()} / {siteData.siteCode.toUpperCase()}
          </div>
          {siteData.projectNote && (
            <div style={{ fontSize: '11px', marginTop: '4px', textTransform: 'none', opacity: 0.8 }}>
              {siteData.projectNote}
            </div>
          )}
        </div>

        <nav>
          {PRIMARY_NAV
            .filter(({ roles }) => !roles || roles.includes(auth.user.role))
            .map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                data-testid={`nav-${label.toLowerCase().replace(" ", "-")}-link`}
                className={isActive(to) ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}

          {auth.user.role === "Admin" && (
            <>
              <Link
                to="/people"
                data-testid="nav-people-link"
                className={isActive("/people") ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <Users size={18} />
                People
              </Link>
              <Link
                to="/activity"
                data-testid="nav-activity-link"
                className={isActive("/activity") ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <Activity size={18} />
                Activity
              </Link>
            </>
          )}

          <Link
            to="/settings"
            data-testid="nav-settings-link"
            className={isActive("/settings") ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            <Settings size={18} />
            Site settings
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-chip">
            <button
              type="button"
              className="avatar avatar-button"
              data-testid="profile-open-button"
              onClick={() => setProfileOpen(true)}
              aria-label="Open profile"
            >
              {auth.user.name?.slice(0, 1)}
            </button>
            <div>
              <strong>{auth.user.name}</strong>
              <small>{auth.user.role}</small>
            </div>
          </div>
          <button className="logout-btn" data-testid="logout-button" onClick={logout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <header className="mobile-header">
        <button className="icon-btn" data-testid="open-menu-button" onClick={() => setOpen(true)}>
          <Menu size={20} />
        </button>
        <span className="brand-mobile">BUILD<span>LEDGER</span></span>
      </header>

      <main className="main">
        <div className="topbar">
          <div>
            <span className="eyebrow">
              FIELD LEDGER / {location.pathname.slice(1) || "OVERVIEW"}
            </span>
            <h1>{pageTitle}</h1>
          </div>
          <button className="icon-btn" data-testid="theme-toggle-button" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        {children}
      </main>
      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={auth.user}
      />
    </div>
  );
}