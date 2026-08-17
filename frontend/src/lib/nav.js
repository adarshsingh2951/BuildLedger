import { LayoutDashboard, Boxes, ClipboardList, ArrowLeftRight, ScanLine } from "lucide-react";

export const PRIMARY_NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/materials", label: "Materials", icon: Boxes ,  roles: ["Admin", "Storekeeper", "Engineer"] },
  { to: "/tasks", label: "Site tasks", icon: ClipboardList },
  { to: "/transactions", label: "Ledger", icon: ArrowLeftRight , roles: ["Admin", "Storekeeper", "Engineer"] },
  { to: "/yolo", label: "Future count", icon: ScanLine },
];

export const PAGE_TITLES = {
  "/": "Overview",
  "/materials": "Materials",
  "/tasks": "Site tasks",
  "/transactions": "Transaction ledger",
  "/people": "People & access",
  "/activity": "Activity feed",
  "/settings": "Site settings",
  "/yolo": "Future counting",
};
