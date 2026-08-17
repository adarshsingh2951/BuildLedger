import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, UserPlus, AlertTriangle, CheckCircle2, Users, HardHat } from "lucide-react";
import { api, getError } from "@/lib/api";
import { Loading } from "@/components/common";

const dayMs = 1000 * 60 * 60 * 24;

export default function TaskDetailPage({ auth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [rosterEng, setRosterEng] = useState([]);
  // CHANGED: renamed from rosterLab to rosterWorker
  const [rosterWorker, setRosterWorker] = useState([]); 
  // CHANGED: "engineer" | "worker" | null
  const [rosterOpen, setRosterOpen] = useState(null); 
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [taskRes, matRes] = await Promise.all([
      api.get(`/tasks/${id}`),
      api.get("/materials"),
    ]);
    setTask(taskRes.data);
    setMaterials(matRes.data);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const openRoster = async (kind) => {
    setRosterOpen(kind);
    const role = kind === "engineer" ? "Engineer" : "Worker";
    const response = await api.get(`/tasks/roster?role=${role}`);
    if (kind === "engineer") setRosterEng(response.data);
    else setRosterWorker(response.data); // CHANGED
  };

  const isMember = (userId) =>
    task.engineers.some((e) => (e.id || e._id) === userId) ||
    // CHANGED: task.labours to task.workers
    task.workers.some((w) => (w.id || w._id) === userId); 

  const addMember = async (userId, kind) => {
    setError("");
    try {
      // FIX: Ensure 'kind' is properly capitalized for the backend Zod validation schema
      const payloadKind = kind === "engineer" ? "Engineer" : "Worker";
      await api.post(`/tasks/${id}/members`, { userId, kind: payloadKind });
      setRosterOpen(null);
      load();
    } catch (err) {
      setError(getError(err));
    }
  };

  const removeMember = async (userId) => {
    await api.delete(`/tasks/${id}/members/${userId}`);
    load();
  };

  const canEdit =
    task &&
    (auth.user.role === "Admin" ||
      auth.user.role === "Storekeeper" ||
      task.engineers.some((e) => (e.id || e._id) === auth.user.id));

  const canAddEngineer = auth.user.role === "Admin" || auth.user.role === "Storekeeper";
  // CHANGED: canAddLabour to canAddWorker
  const canAddWorker = canEdit; 

  const saveField = async (patch) => {
    try {
      await api.patch(`/tasks/${id}`, patch);
      load();
    } catch (err) {
      setError(getError(err));
    }
  };

  const addRequirement = () => {
    if (!materials.length) return;
    const first = materials[0];
    saveField({
      requiredMaterials: [
        ...task.requiredMaterials,
        { materialId: first.id, materialName: first.name, unit: first.unit, quantity: 1 },
      ],
    });
  };

  const updateRequirement = (index, patch) => {
    const next = task.requiredMaterials.map((row, i) => (i === index ? { ...row, ...patch } : row));
    saveField({ requiredMaterials: next });
  };

  const removeRequirement = (index) => {
    const next = task.requiredMaterials.filter((_, i) => i !== index);
    saveField({ requiredMaterials: next });
  };

  const complete = async () => {
    setError("");
    setBusy(true);
    try {
      await api.post(`/tasks/${id}/complete`);
      load();
    } catch (err) {
      const shortfall = err?.response?.data?.shortfall;
      if (shortfall?.length) {
        setError(
          `Cannot complete — ${shortfall
            .map((s) => `${s.name} used ${s.used}/${s.required}`)
            .join(", ")}`
        );
      } else {
        setError(getError(err));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!task) return <Loading />;

  const daysElapsed = Math.max(
    0,
    Math.round(((task.completedAt ? new Date(task.completedAt) : new Date()) - new Date(task.createdAt)) / dayMs)
  );

  let deliveryBadge = null;
  if (task.status === "Completed" && task.expectedDays > 0) {
    if (daysElapsed <= task.expectedDays) {
      deliveryBadge = <span className="state healthy"><CheckCircle2 size={14} /> Finished on time ({daysElapsed}d of {task.expectedDays}d)</span>;
    } else {
      deliveryBadge = <span className="state danger"><AlertTriangle size={14} /> Delayed by {daysElapsed - task.expectedDays}d</span>;
    }
  }

  return (
    <div className="task-detail">
      <button className="text-btn" onClick={() => navigate("/tasks")} data-testid="back-to-tasks">
        <ArrowLeft size={16} /> Back to task board
      </button>

      <header className="task-hero">
        <div>
          <span className="eyebrow">
            TASK / {task.status.toUpperCase()}
            {task.expectedDays > 0 && ` · target ${task.expectedDays}d`}
          </span>
          <h1>{task.taskName}</h1>
          <p className="muted">
            Created {task.createdAt?.slice(0, 10)} · Lead {task.assignedName || "—"}
          </p>
          {deliveryBadge}
        </div>
        <div className="task-progress-card">
          <label>
            Progress · <b>{task.progress}%</b>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={task.progress}
              disabled={!canEdit || task.status === "Completed"}
              onChange={(event) => saveField({ progress: Number(event.target.value) })}
              data-testid="task-progress-slider"
            />
          </label>
          <label>
            Expected days
            <input
              type="number"
              min="0"
              value={task.expectedDays}
              disabled={!canEdit || task.status === "Completed"}
              onChange={(event) => saveField({ expectedDays: Number(event.target.value) })}
              data-testid="task-expected-days"
            />
          </label>
        </div>
      </header>

      {error && (
        <div className="task-error" data-testid="task-detail-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="task-grid">
        <section className="surface">
          <div className="section-head">
            <div>
              <span className="eyebrow"><Users size={13} /> ENGINEERS</span>
              <h3>Engineers on this task</h3>
            </div>
            {canAddEngineer && task.status !== "Completed" && (
              <button className="ghost-btn" data-testid="add-engineer-button" onClick={() => openRoster("engineer")}>
                <UserPlus size={15} /> Add
              </button>
            )}
          </div>
          <ul className="member-list">
            {task.engineers.map((eng) => (
              <li key={eng.id || eng._id}>
                <div className="avatar-sm">{eng.name?.slice(0, 1)}</div>
                <div>
                  <strong>{eng.name}</strong>
                  <small>{eng.email}</small>
                </div>
                {canAddEngineer && task.status !== "Completed" && (
                  <button className="icon-btn danger" onClick={() => removeMember(eng.id || eng._id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
            {!task.engineers.length && <li className="muted">No engineers yet</li>}
          </ul>
        </section>

        <section className="surface">
          <div className="section-head">
            <div>
              <span className="eyebrow"><HardHat size={13} /> WORKER</span>
              <h3>Workers on this task</h3>
            </div>
            {/* CHANGED: canAddLabour to canAddWorker, and "worker" parameter */}
            {canAddWorker && task.status !== "Completed" && (
              <button className="ghost-btn" data-testid="add-worker-button" onClick={() => openRoster("worker")}>
                <UserPlus size={15} /> Add
              </button>
            )}
          </div>
          <ul className="member-list">
            {/* CHANGED: task.labours to task.workers */}
            {task.workers.map((worker) => (
              <li key={worker.id || worker._id}>
                <div className="avatar-sm">{worker.name?.slice(0, 1)}</div>
                <div>
                  <strong>{worker.name}</strong>
                  <small>{worker.email}</small>
                </div>
                {canAddWorker && task.status !== "Completed" && (
                  <button className="icon-btn danger" onClick={() => removeMember(worker.id || worker._id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
            {!task.workers.length && <li className="muted">No workers yet</li>}
          </ul>
        </section>

        <section className="surface full">
          <div className="section-head">
            <div>
              <span className="eyebrow">MATERIALS · REQUIRED vs UTILISED</span>
              <h3>Requirements & consumption</h3>
            </div>
            {canEdit && task.status !== "Completed" && (
              <button className="ghost-btn" onClick={addRequirement} data-testid="add-required-material">
                <Plus size={15} /> Add requirement
              </button>
            )}
          </div>

          <table className="task-material-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Required</th>
                <th>Used</th>
                <th>State</th>
                {canEdit && task.status !== "Completed" && <th></th>}
              </tr>
            </thead>
            <tbody>
              {(task.utilised || []).map((row, index) => {
                const editableIndex = task.requiredMaterials.findIndex(
                  (r) => r.materialId.toString() === row.materialId
                );
                const short = row.used < row.required;
                return (
                  <tr key={row.materialId}>
                    <td>
                      {editableIndex >= 0 && canEdit && task.status !== "Completed" ? (
                        <select
                          value={row.materialId}
                          onChange={(event) => {
                            const material = materials.find((m) => m.id === event.target.value);
                            if (material) {
                              updateRequirement(editableIndex, {
                                materialId: material.id,
                                materialName: material.name,
                                unit: material.unit,
                              });
                            }
                          }}
                        >
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <strong>{row.materialName}</strong>
                          <small>{row.unit}</small>
                        </>
                      )}
                    </td>
                    <td>
                      {editableIndex >= 0 && canEdit && task.status !== "Completed" ? (
                        <input
                          type="number"
                          min="0"
                          value={row.required}
                          onChange={(event) =>
                            updateRequirement(editableIndex, { quantity: Number(event.target.value) })
                          }
                        />
                      ) : (
                        <span className="mono">{row.required}</span>
                      )}
                    </td>
                    <td className="mono">{row.used}</td>
                    <td>
                      {row.required === 0 ? (
                        <span className="state">Extra</span>
                      ) : short ? (
                        <span className="state danger">
                          <AlertTriangle size={13} /> Short by {row.required - row.used}
                        </span>
                      ) : (
                        <span className="state healthy">
                          <CheckCircle2 size={13} /> Fulfilled
                        </span>
                      )}
                    </td>
                    {canEdit && task.status !== "Completed" && (
                      <td>
                        {editableIndex >= 0 && (
                          <button
                            className="icon-btn danger"
                            onClick={() => removeRequirement(editableIndex)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {!task.utilised?.length && (
                <tr>
                  <td colSpan={5} className="muted center">
                    No requirements yet — add materials the crew will need on site.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="muted">
            Consumption is recorded from the <b>Transaction ledger</b> — every outbound entry
            linked to this task counts toward "Used" here. Ledger edits happen on the ledger page.
          </p>
        </section>

        <section className="surface full">
          <div className="section-head">
            <div>
              <span className="eyebrow">CLOSE-OUT</span>
              <h3>Mark this task complete</h3>
            </div>
            {canEdit && task.status !== "Completed" && (
              <button
                className="primary-btn compact"
                onClick={complete}
                disabled={busy}
                data-testid="task-complete-button"
              >
                <CheckCircle2 size={16} /> Complete task
              </button>
            )}
          </div>
          {task.status === "Completed" ? (
            <p className="muted">
              {/* CHANGED: labours to workers context */ }
              Completed on {task.completedAt?.slice(0, 10)} · {task.engineers.length} engineer(s) and{" "}
              {task.workers.length} worker(s) were on this task and are now free to be reassigned.
              This roster stays in the record for history.
            </p>
          ) : (
            <p className="muted">
              Completing the task validates every required material has been utilised via the ledger.
              Team members are freed automatically.
            </p>
          )}
        </section>
      </div>

      {rosterOpen && (
        <>
          <div className="roster-overlay" onClick={() => setRosterOpen(null)} />
          <aside className="roster-drawer" data-testid={`roster-${rosterOpen}`}>
            <header className="roster-head">
              <h3>
                {/* CHANGED: "labourers" to "workers" */}
                Available {rosterOpen === "engineer" ? "engineers" : "workers"}
              </h3>
              <button className="icon-btn" onClick={() => setRosterOpen(null)}>✕</button>
            </header>
            <ul className="roster-list">
              {/* CHANGED: rosterLab to rosterWorker */}
              {(rosterOpen === "engineer" ? rosterEng : rosterWorker).map((person) => {
                const already = isMember(person.id);
                const disabled = !!person.busyOnTask || already;
                return (
                  <li
                    key={person.id}
                    className={person.busyOnTask ? "busy" : ""}
                    data-testid={`roster-row-${person.id}`}
                  >
                    <div>
                      <strong>{person.name}</strong>
                      <small>
                        {already
                          ? "Already on this task"
                          : person.busyOnTask
                          ? `Busy · ${person.busyOnTask}`
                          : "Available"}
                      </small>
                    </div>
                    <button
                      className="primary-btn compact"
                      disabled={disabled}
                      onClick={() => addMember(person.id, rosterOpen)}
                    >
                      Add
                    </button>
                  </li>
                );
              })}
              {!(rosterOpen === "engineer" ? rosterEng : rosterWorker).length && (
                <li className="muted">Nobody with that role yet</li>
              )}
            </ul>
          </aside>
        </>
      )}
    </div>
  );
}