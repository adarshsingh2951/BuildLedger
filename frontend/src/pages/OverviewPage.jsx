import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Loading, Empty, Stat } from "@/components/common";

export default function OverviewPage({ auth }) {
  const [data, setData] = useState(null);
  const canSeeInventory = auth?.user?.role !== "Worker";

  useEffect(() => {
    api.get("/dashboard").then((response) => setData(response.data));
  }, []);

  if (!data) return <Loading />;

  const lowStock = data.materials.filter(
    (material) => material.currentStock <= material.minimumThreshold
  );
  const inboundCount = data.transactions.filter(
    (transaction) => transaction.transactionType === "Inbound"
  ).length;
  const openTasks = data.tasks.filter((task) => task.status !== "Completed").length;

  return (
    <div className="page-grid">
      <div className="stats">
        <Stat
          label="Materials tracked"
          value={data.materials.length}
          detail="Across active catalog"
        />
        <Stat
          label="Low stock"
          value={lowStock.length}
          detail={lowStock.length ? "Needs attention today" : "All thresholds healthy"}
          warning={lowStock.length}
        />
        <Stat label="Open tasks" value={openTasks} detail="Pending or in progress" />
        <Stat
          label="Movements"
          value={data.transactions.length}
          detail={`${inboundCount} inbound this period`}
        />
      </div>

      <section className="surface span-2">
        <div className="section-head">
          <div>
            <span className="eyebrow">STOCK HEALTH / LIVE</span>
            <h2>Material watchlist</h2>
          </div>
          {canSeeInventory && (
            <Link className="ghost-btn" data-testid="overview-materials-link" to="/materials">
              View all <span>→</span>
            </Link>
          )}
        </div>
        {data.materials.length ? (
          <div className="health-list">
            {data.materials.slice(0, 6).map((material) => {
              const barWidth = Math.min(
                100,
                (material.currentStock / Math.max(material.minimumThreshold * 2, 1)) * 100
              );
              const isLow = material.currentStock <= material.minimumThreshold;
              return (
                <div
                  className="health-row"
                  key={material.sku}
                  data-testid={`material-row-${material.sku}`}
                >
                  <span className={`priority p-${material.priorityTag.toLowerCase()}`}>
                    {material.priorityTag}
                  </span>
                  <div className="row-main">
                    <strong>{material.name}</strong>
                    <small>
                      {material.sku} · {material.unit}
                    </small>
                  </div>
                  <div className="stock-bar">
                    <i style={{ width: `${barWidth}%` }} />
                  </div>
                  <b className={isLow ? "danger-text" : ""}>{material.currentStock}</b>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty text="No materials yet" />
        )}
      </section>

      <section className="surface">
        <div className="section-head">
          <div>
            <span className="eyebrow">ACTION QUEUE</span>
            <h2>Site tasks</h2>
          </div>
          <Link className="ghost-btn" data-testid="overview-tasks-link" to="/tasks">
            Open board →
          </Link>
        </div>
        {data.tasks.slice(0, 5).map((task) => (
          <div className="task-mini" key={task.taskName}>
            <span className={`dot ${task.status.toLowerCase().replace(" ", "-")}`} />
            <div>
              <strong>{task.taskName}</strong>
              <small>{task.assignedName || task.assignedTo}</small>
            </div>
            <span className="status-text">{task.status}</span>
          </div>
        ))}
        {!data.tasks.length && <Empty text="No tasks assigned" />}
      </section>

      <section className="surface">
        <div className="section-head">
          <div>
            <span className="eyebrow">LATEST MOVEMENTS</span>
            <h2>Ledger pulse</h2>
          </div>
          {canSeeInventory && (
            <Link className="ghost-btn" data-testid="overview-ledger-link" to="/transactions">
              Open ledger →
            </Link>
          )}
        </div>
        {data.transactions.slice(0, 5).map((transaction, index) => (
          <div className="ledger-mini" key={index}>
            <span className={transaction.transactionType === "Inbound" ? "inbound" : "outbound"}>
              {transaction.transactionType === "Inbound" ? "+" : "−"}
            </span>
            <div>
              <strong>{transaction.materialName}</strong>
              <small>{transaction.processedByName}</small>
            </div>
            <b>{transaction.quantity}</b>
          </div>
        ))}
        {!data.transactions.length && <Empty text="No movements recorded" />}
      </section>
    </div>
  );
}