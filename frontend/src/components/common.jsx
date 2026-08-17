import { PackageOpen } from "lucide-react";

export function Loading() {
  return (
    <div className="loading" data-testid="loading-state">
      Loading site data…
    </div>
  );
}

export function Empty({ text }) {
  return (
    <div className="empty" data-testid="empty-state">
      <PackageOpen size={22} />
      {text}
    </div>
  );
}

export function Stat({ label, value, detail, warning }) {
  return (
    <div className="stat" data-testid={`metric-${label.toLowerCase().replaceAll(" ", "-")}`}>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <small className={warning ? "warning-text" : "muted"}>{detail}</small>
    </div>
  );
}
