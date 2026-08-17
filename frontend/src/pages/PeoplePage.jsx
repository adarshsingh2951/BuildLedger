import { useEffect, useState, useCallback } from "react";
import { Plus, UserX, UserCheck } from "lucide-react";
import { api, getError } from "@/lib/api";

const ROLES = ["Admin", "Storekeeper", "Engineer","Worker"];
const EMPTY_INVITE = { name: "", email: "", password: "", role: "Engineer" };

export default function PeoplePage({ auth }) {
  const [people, setPeople] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState(EMPTY_INVITE);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get("/users").then((response) => setPeople(response.data));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (person, event) => {
    await api.patch(`/users/${person.id}/role`, { role: event.target.value });
    load();
  };

  const toggleActive = async (person) => {
    await api.patch(`/users/${person.id}/active`);
    load();
  };

  const addPerson = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/users", invite);
      setShowInvite(false);
      setInvite(EMPTY_INVITE);
      load();
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <div className="page-grid">
      <section className="surface full">
        <div className="section-head">
          <div>
            <span className="eyebrow">ACCESS / PERSONNEL</span>
            <h2>People on this site</h2>
          </div>
          <div className="toolbar-actions">
            <span className="count-label">{people.length} accounts</span>
            <button
              className="primary-btn compact"
              data-testid="person-add-button"
              onClick={() => setShowInvite((state) => !state)}
            >
              <Plus size={16} /> Add person
            </button>
          </div>
        </div>

        {showInvite && (
          <form className="inline-form" onSubmit={addPerson}>
            <label>
              Name
              <input
                data-testid="person-name-input"
                required
                value={invite.name}
                onChange={(event) => setInvite({ ...invite, name: event.target.value })}
              />
            </label>
            <label>
              Email
              <input
                data-testid="person-email-input"
                type="email"
                required
                value={invite.email}
                onChange={(event) => setInvite({ ...invite, email: event.target.value })}
              />
            </label>
            <label>
              Temporary password
              <input
                data-testid="person-password-input"
                type="text"
                required
                minLength={6}
                value={invite.password}
                onChange={(event) =>
                  setInvite({ ...invite, password: event.target.value })
                }
              />
            </label>
            <label>
              Role
              <select
                data-testid="person-role-input"
                value={invite.role}
                onChange={(event) => setInvite({ ...invite, role: event.target.value })}
              >
                {ROLES.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
            <button className="primary-btn compact" data-testid="person-submit-button">
              Create account
            </button>
            {error && <span className="error">{error}</span>}
          </form>
        )}

        <table>
          <caption className="sr-only">People and access roles</caption>
          <thead>
            <tr>
              <th>Person</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => {
              const isSelf = person.id === auth.user.id;
              return (
                <tr key={person.id}>
                  <td>
                    <strong>{person.name}</strong>
                    {isSelf && <small className="muted"> (you)</small>}
                  </td>
                  <td className="muted">{person.email}</td>
                  <td>
                    <select
                      data-testid={`user-role-select-${person.id}`}
                      value={person.role}
                      disabled={isSelf}
                      onChange={(event) => changeRole(person, event)}
                    >
                      {ROLES.map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={person.active ? "state healthy" : "state danger"}>
                      {person.active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="muted">{person.createdAt?.slice(0, 10)}</td>
                  <td>
                    {!isSelf && (
                      <button
                        className="icon-btn"
                        data-testid={`user-toggle-${person.id}`}
                        onClick={() => toggleActive(person)}
                        title={person.active ? "Suspend account" : "Reactivate account"}
                      >
                        {person.active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
