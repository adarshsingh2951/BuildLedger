import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Download, AlertTriangle, CheckCircle2, Trash2, Edit2, Save, X } from "lucide-react";
import { api, getError } from "@/lib/api";
import { Empty } from "@/components/common";

const EMPTY_FORM = {
  sku: "",
  name: "",
  priorityTag: "A",
  unit: "bags",
  currentStock: 0,
  minimumThreshold: 10,
};

export default function MaterialsPage({ auth }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [priorityTag, setPriorityTag] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ currentStock: 0, minimumThreshold: 0 });

  const canEdit = auth.user.role === "Admin" || auth.user.role === "Storekeeper";

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (priorityTag) params.set("priorityTag", priorityTag);
    if (lowStock) params.set("lowStock", "true");
    api.get(`/materials?${params}`).then((response) => setItems(response.data));
  }, [query, priorityTag, lowStock]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/materials", {
        ...form,
        currentStock: Number(form.currentStock),
        minimumThreshold: Number(form.minimumThreshold),
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(getError(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this material from the catalog?")) return;
    await api.delete(`/materials/${id}`);
    load();
  };
  const startEdit = (material) => {
    setEditingId(material.id);
    setEditValues({
      currentStock: material.currentStock,
      minimumThreshold: material.minimumThreshold,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

 const saveEdit = async (material) => {
    try {
      await api.patch(`/materials/${material.id}`, {
        ...material,
        currentStock: Number(editValues.currentStock),
        minimumThreshold: Number(editValues.minimumThreshold),
      });
      setEditingId(null);
      load();
    } catch (err) {
      alert(getError(err));
    }
  };

  const exportCsv = () => {
    const rows = [
      ["SKU", "Name", "Priority", "Unit", "Stock", "Threshold"],
      ...items.map((material) => [
        material.sku,
        material.name,
        material.priorityTag,
        material.unit,
        material.currentStock,
        material.minimumThreshold,
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "buildledger-materials.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-grid">
      <section className="surface full">
        <div className="toolbar">
          <div className="search">
            <Search size={17} />
            <input
              data-testid="material-search-input"
              placeholder="Search SKU or material"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="toolbar-actions">
            <select
              data-testid="material-filter-select"
              value={priorityTag}
              onChange={(event) => setPriorityTag(event.target.value)}
            >
              <option value="">All ABC</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select>
            <label className="check-label">
              <input
                data-testid="material-low-filter"
                type="checkbox"
                checked={lowStock}
                onChange={(event) => setLowStock(event.target.checked)}
              />{" "}
              Low stock
            </label>
            <button
              className="ghost-btn"
              data-testid="materials-export-button"
              onClick={exportCsv}
            >
              <Download size={16} /> CSV
            </button>
            {canEdit && (
              <button
                className="primary-btn compact"
                data-testid="materials-add-button"
                onClick={() => setShowForm((state) => !state)}
              >
                <Plus size={17} /> Add material
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <form className="inline-form" onSubmit={submit}>
            <label>
              SKU
              <input
                data-testid="material-sku-input"
                required
                value={form.sku}
                onChange={(event) => setForm({ ...form, sku: event.target.value })}
              />
            </label>
            <label>
              Material name
              <input
                data-testid="material-name-input"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
            <label>
              ABC priority
              <select
                data-testid="material-priority-select"
                value={form.priorityTag}
                onChange={(event) =>
                  setForm({ ...form, priorityTag: event.target.value })
                }
              >
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
            </label>
            <label>
              Unit
              <input
                data-testid="material-unit-input"
                required
                value={form.unit}
                onChange={(event) => setForm({ ...form, unit: event.target.value })}
              />
            </label>
            <label>
              Opening stock
              <input
                data-testid="material-stock-input"
                type="number"
                min="0"
                value={form.currentStock}
                onChange={(event) =>
                  setForm({ ...form, currentStock: event.target.value })
                }
              />
            </label>
            <label>
              Min threshold
              <input
                data-testid="material-threshold-input"
                type="number"
                min="0"
                value={form.minimumThreshold}
                onChange={(event) =>
                  setForm({ ...form, minimumThreshold: event.target.value })
                }
              />
            </label>
            <button className="primary-btn compact" data-testid="material-submit-button">
              Save material
            </button>
            {error && <span className="error">{error}</span>}
          </form>
        )}

        <table>
          <caption className="sr-only">Materials inventory table</caption>
          <thead>
            <tr>
              <th>Material</th>
              <th>ABC</th>
              <th>Stock</th>
              <th>Threshold</th>
              <th>State</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((material) => {
              const isEditing = editingId === material.id;
              const isLow = 
                (isEditing ? editValues.currentStock : material.currentStock) <= 
                (isEditing ? editValues.minimumThreshold : material.minimumThreshold);

              return (
                <tr key={material.sku} data-testid={`material-table-row-${material.sku}`}>
                  <td>
                    <strong>{material.name}</strong>
                    <small>
                      {material.sku} · {material.unit}
                    </small>
                  </td>
                  <td>
                    <span className={`priority p-${material.priorityTag.toLowerCase()}`}>
                      {material.priorityTag}
                    </span>
                  </td>
                  
                  <td className="mono">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        className="edit-input-small"
                        value={editValues.currentStock}
                        onChange={(e) =>
                          setEditValues({ ...editValues, currentStock: e.target.value })
                        }
                      />
                    ) : (
                      material.currentStock
                    )}
                  </td>
                  
                  <td className="mono">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        className="edit-input-small"
                        value={editValues.minimumThreshold}
                        onChange={(e) =>
                          setEditValues({ ...editValues, minimumThreshold: e.target.value })
                        }
                      />
                    ) : (
                      material.minimumThreshold
                    )}
                  </td>
                  
                  <td>
                    {isLow ? (
                      <span className="state danger">
                        <AlertTriangle size={14} /> Low stock
                      </span>
                    ) : (
                      <span className="state healthy">
                        <CheckCircle2 size={14} /> Healthy
                      </span>
                    )}
                  </td>
                  
                  {canEdit && (
                    <td className="actions-cell">
                      {isEditing ? (
                        <>
                          <button
                            className="icon-btn mr-1"
                            onClick={() => saveEdit(material)}
                            title="Save changes"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            className="icon-btn"
                            onClick={cancelEdit}
                            title="Cancel editing"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="icon-btn mr-1"
                            onClick={() => startEdit(material)}
                            title="Edit stock and threshold"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="icon-btn danger"
                            data-testid={`material-delete-${material.sku}`}
                            onClick={() => remove(material.id)}
                            title="Delete material"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!items.length && <Empty text="No materials match this search" />}
      </section>
    </div>
  );
}