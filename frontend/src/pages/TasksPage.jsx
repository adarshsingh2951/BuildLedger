import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { api, getError } from "@/lib/api";

const STATUSES = ["Pending", "In Progress", "Completed"];

export default function TasksPage({ auth }) {
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ taskName: "", assignedTo: "" });
  const [error, setError] = useState("");

  const canAssign = auth.user.role === "Admin" || auth.user.role === "Storekeeper";

  const load = useCallback(() => {
    Promise.all([
      api.get("/tasks"),
      api.get("/users").catch(() => ({ data: [] })),
    ]).then(([tasksResponse, usersResponse]) => {
      setItems(tasksResponse.data);
      setPeople(usersResponse.data);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/tasks", form);
      setShowForm(false);
      setForm({ taskName: "", assignedTo: "" });
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
            <span className="eyebrow">WORK PACKAGES / ASSIGNMENT</span>
            <h2>Site task board</h2>
          </div>
          {canAssign && (
            <button
              className="primary-btn compact"
              data-testid="task-add-button"
              onClick={() => setShowForm((state) => !state)}
            >
              <Plus size={17} /> Assign task
            </button>
          )}
        </div>

        {showForm && (
          <form className="inline-form" onSubmit={add}>
            <label>
              Task name
              <input
                data-testid="task-name-input"
                required
                placeholder="Pouring 3rd floor slab"
                value={form.taskName}
                onChange={(event) => setForm({ ...form, taskName: event.target.value })}
              />
            </label>
            <label>
              Assign to
              <select
                data-testid="task-assignee-select"
                required
                value={form.assignedTo}
                onChange={(event) =>
                  setForm({ ...form, assignedTo: event.target.value })
                }
              >
                <option value="">Select person</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} · {person.role}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-btn compact" data-testid="task-submit-button">
              Create task
            </button>
            {error && <span className="error">{error}</span>}
          </form>
        )}

        <div className="task-columns">
          {STATUSES.map((status) => {
            const filtered = items.filter((task) => task.status === status);
            return (
              <div className="task-column" key={status}>
                <div className="column-label">
                  <span className={`dot ${status.toLowerCase().replace(" ", "-")}`} />
                  {status}
                  <b>{filtered.length}</b>
                </div>
                {filtered.map((task) => (
                  <Link
                    to={`/tasks/${task.id || task._id}`}
                    className="task-card"
                    data-testid={`task-card-${task.taskName}`}
                    key={task.id || task._id || task.taskName}
                  >
                    <strong>{task.taskName}</strong>
                    <small className="task-assignee">{task.assignedName || task.assignedTo}</small>
                    <div className="task-card-meta">
                      <span>{task.progress ?? 0}% done</span>
                      {task.expectedDays > 0 && <span>· target {task.expectedDays}d</span>}
                      <span className="open-detail">Open →</span>
                    </div>
                  </Link>
                ))}
                {!filtered.length && <div className="muted small">Nothing here yet</div>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}