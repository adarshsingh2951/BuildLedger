import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { api } from "@/lib/api";
import { Empty } from "@/components/common";

export default function ActivityPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/activity").then((response) => setItems(response.data));
  }, []);

  return (
    <div className="page-grid">
      <section className="surface full">
        <div className="section-head">
          <div>
            <span className="eyebrow">AUDIT TRAIL / OPERATIONS</span>
            <h2>Recent site activity</h2>
          </div>
        </div>
        {items.length ? (
          items.map((entry, index) => (
            <div
              className="task-mini"
              data-testid={`activity-row-${index}`}
              key={entry._id || index}
            >
              <Activity size={17} />
              <div>
                <strong>
                  {entry.actor} {entry.action} {entry.entity}
                </strong>
                <small>{entry.detail || "No additional detail"}</small>
              </div>
              <span className="muted">
                {entry.createdAt?.slice(0, 16).replace("T", " ")}
              </span>
            </div>
          ))
        ) : (
          <Empty text="No activity recorded yet" />
        )}
      </section>
    </div>
  );
}
