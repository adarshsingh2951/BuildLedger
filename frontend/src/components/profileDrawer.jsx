import { useState, useEffect } from "react";
import { X, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { api, getError } from "@/lib/api";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ProfileDrawer({ open, onClose, user }) {
  const [form, setForm] = useState(EMPTY);
  const [show, setShow] = useState({ current: false, next: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      setError("");
      setSuccess(false);
      setShow({ current: false, next: false });
    }
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }
    setBusy(true);
    try {
      await api.patch("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm(EMPTY);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className={`profile-drawer-overlay ${open ? "visible" : ""}`}
        onClick={onClose}
        data-testid="profile-drawer-overlay"
      />
      <aside
        className={`profile-drawer ${open ? "open" : ""}`}
        role="dialog"
        aria-hidden={!open}
        data-testid="profile-drawer"
      >
        <header className="profile-drawer-head">
          <div>
            <span className="eyebrow">ACCOUNT / PROFILE</span>
            <h3>Your account</h3>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            data-testid="profile-drawer-close"
            aria-label="Close profile"
          >
            <X size={18} />
          </button>
        </header>

        <section className="profile-identity">
          <div className="profile-avatar">{user?.name?.slice(0, 1)}</div>
          <div>
            <strong data-testid="profile-name">{user?.name}</strong>
            <small data-testid="profile-email">{user?.email}</small>
            <span className={`profile-role role-${user?.role?.toLowerCase()}`}>
              {user?.role}
            </span>
          </div>
        </section>

        <form className="profile-form" onSubmit={submit}>
          <span className="eyebrow">CHANGE PASSWORD</span>

          <label>
            Current password
            <div className="password-field">
              <input
                data-testid="profile-current-password"
                type={show.current ? "text" : "password"}
                required
                value={form.currentPassword}
                onChange={(event) =>
                  setForm({ ...form, currentPassword: event.target.value })
                }
              />
              <button
                type="button"
                className="icon-btn ghost"
                onClick={() => setShow({ ...show, current: !show.current })}
                tabIndex={-1}
              >
                {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label>
            New password
            <div className="password-field">
              <input
                data-testid="profile-new-password"
                type={show.next ? "text" : "password"}
                required
                minLength={6}
                value={form.newPassword}
                onChange={(event) =>
                  setForm({ ...form, newPassword: event.target.value })
                }
              />
              <button
                type="button"
                className="icon-btn ghost"
                onClick={() => setShow({ ...show, next: !show.next })}
                tabIndex={-1}
              >
                {show.next ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label>
            Confirm new password
            <input
              data-testid="profile-confirm-password"
              type={show.next ? "text" : "password"}
              required
              minLength={6}
              value={form.confirmPassword}
              onChange={(event) =>
                setForm({ ...form, confirmPassword: event.target.value })
              }
            />
          </label>

          {error && (
            <div className="profile-error" data-testid="profile-error" aria-live="polite">
              {error}
            </div>
          )}

          {success && (
            <div className="profile-success" data-testid="profile-success" aria-live="polite">
              <CheckCircle2 size={16} /> Password updated
            </div>
          )}

          <button
            className="primary-btn compact"
            disabled={busy}
            data-testid="profile-save-button"
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      </aside>
    </>
  );
}