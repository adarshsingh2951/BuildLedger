import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { api, getError } from "@/lib/api";
import { Empty } from "@/components/common";

const EMPTY_FORM = {
  materialId: "",
  transactionType: "Inbound",
  quantity: 1,
  relatedTask: "",
};

export default function TransactionsPage({ auth }) {
  const [items, setItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [type, setType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const canRecord = auth.user.role === "Admin" || auth.user.role === "Storekeeper";

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (type) params.set("transactionType", type);
    Promise.all([
      api.get(`/transactions?${params}`),
      api.get("/materials"),
      api.get("/tasks").catch(() => ({ data: [] })),
    ]).then(([txResponse, matResponse, taskResponse]) => {
      setItems(txResponse.data);
      setMaterials(matResponse.data);
      setTasks(taskResponse.data);
    });
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/transactions", {
        ...form,
        quantity: Number(form.quantity),
        relatedTask: form.relatedTask || null,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
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
            <span className="eyebrow">AUDIT TRAIL / STOCK MOVEMENT</span>
            <h2>Transaction ledger</h2>
          </div>
          <div className="toolbar-actions">
            <select
              data-testid="ledger-type-filter"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="">All movements</option>
              <option>Inbound</option>
              <option>Outbound</option>
            </select>
            {canRecord && (
              <button
                className="primary-btn compact"
                data-testid="transaction-add-button"
                onClick={() => setShowForm((state) => !state)}
              >
                <Plus size={17} /> Record movement
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <form className="inline-form" onSubmit={submit}>
            <label>
              Material
              <select
                data-testid="transaction-material-select"
                required
                value={form.materialId}
                onChange={(event) =>
                  setForm({ ...form, materialId: event.target.value })
                }
              >
                <option value="">Select material</option>
                {materials.map((material) => (
                  <option
                    key={material.id || material._id}
                    value={material.id || material._id}
                  >
                    {material.name} · {material.currentStock} {material.unit}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Movement
              <select
                data-testid="transaction-type-select"
                value={form.transactionType}
                onChange={(event) =>
                  setForm({ ...form, transactionType: event.target.value })
                }
              >
                <option>Inbound</option>
                <option>Outbound</option>
              </select>
            </label>
            <label>
              Quantity
              <input
                data-testid="transaction-quantity-input"
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(event) =>
                  setForm({ ...form, quantity: event.target.value })
                }
              />
            </label>
            <label>
              Linked task <small className="muted">(optional)</small>
              <select
                data-testid="transaction-task-select"
                value={form.relatedTask}
                onChange={(event) =>
                  setForm({ ...form, relatedTask: event.target.value })
                }
              >
                <option value="">None</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.taskName}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-btn compact" data-testid="transaction-submit-button">
              Record
            </button>
            {error && (
              <span className="error" data-testid="transaction-error">
                {error}
              </span>
            )}
          </form>
        )}

        <table>
          <caption className="sr-only">Inventory transaction ledger</caption>
          <thead>
            <tr>
              <th>Movement</th>
              <th>Material</th>
              <th>Quantity</th>
              <th>Processed by</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {items.map((transaction, index) => (
              <tr key={transaction.id || index}>
                <td>
                  <span
                    className={
                      transaction.transactionType === "Inbound"
                        ? "state healthy"
                        : "state danger"
                    }
                  >
                    {transaction.transactionType}
                  </span>
                </td>
                <td>
                  <strong>{transaction.materialName}</strong>
                </td>
                <td className="mono">{transaction.quantity}</td>
                <td>{transaction.processedByName}</td>
                <td className="muted">
                  {transaction.timestamp?.slice(0, 16).replace("T", " ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <Empty text="Your ledger is clear" />}
      </section>
    </div>
  );
}
