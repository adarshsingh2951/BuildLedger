import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const EMPTY_SETTINGS = { siteName: "", siteCode: "", projectNote: "" };

export default function SettingsPage({ auth }) {
  const [form, setForm] = useState(EMPTY_SETTINGS);
  const [saved, setSaved] = useState(false);

  const canEdit = auth?.user?.role === "Admin";

  useEffect(() => {
    api.get("/settings").then((response) =>
      setForm({ ...EMPTY_SETTINGS, ...response.data })
    );
  }, []);

  const save = async (event) => {
    event.preventDefault();
    if (!canEdit) return;

    await api.put("/settings", form);
    window.dispatchEvent(new Event("buildledger:settings-updated"));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-grid">
      <section className="surface full">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              {canEdit ? "SITE CONFIGURATION / ADMIN" : "SITE CONFIGURATION / READ ONLY"}
            </span>
            <h2>PROJECT</h2>
          </div>
        </div>

        {!canEdit && (
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}><p className="muted " data-testid="settings-readonly-note">
            You have read-only access. Only Admins can update site settings.
          </p><br></br></div>
        )}

        <form className="settings-form" onSubmit={save}>
          <label>
            Site name
            <input
              data-testid="settings-site-name"
              required
              disabled={!canEdit}
              value={form.siteName}
              onChange={(event) =>
                setForm({ ...form, siteName: event.target.value })
              }
            />
          </label>

          <label>
            Site code
            <input
              data-testid="settings-site-code"
              required
              disabled={!canEdit}
              value={form.siteCode}
              onChange={(event) =>
                setForm({ ...form, siteCode: event.target.value })
              }
            />
          </label>

          <label>
            Project note
            <textarea
              data-testid="settings-project-note"
              disabled={!canEdit}
              value={form.projectNote}
              onChange={(event) =>
                setForm({ ...form, projectNote: event.target.value })
              }
            />
          </label>

          {canEdit && (
            <button
              className="primary-btn compact"
              data-testid="settings-save-button"
            >
              Save settings
            </button>
          )}

          {saved && (
            <span
              className="state healthy"
              data-testid="settings-saved-message"
            >
              Settings saved
            </span>
          )}
        </form>
      </section>
    </div>
  );
}