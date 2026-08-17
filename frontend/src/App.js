import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/common";
import { Shell } from "@/components/Shell";
import AuthPage from "@/pages/AuthPage";
import OverviewPage from "@/pages/OverviewPage";
import MaterialsPage from "@/pages/MaterialsPage";
import TasksPage from "@/pages/TasksPage";
import TransactionsPage from "@/pages/TransactionsPage";
import PeoplePage from "@/pages/PeoplePage";
import ActivityPage from "@/pages/ActivityPage";
import SettingsPage from "@/pages/SettingsPage";
import YoloPage from "@/pages/YoloPage";
import TaskDetailPage from "@/pages/TaskDetailPage";
import "@/App.css";

export default function App() {
  const [auth, setAuth] = useAuth();
  if (!auth.ready) return <Loading />;

  const onAuth = (user) => setAuth({ user, ready: true });

  if (!auth.user) {
    return (
      <BrowserRouter>
        <Routes>
         
          <Route path="/register" element={<AuthPage register onAuth={onAuth} />} />
          <Route path="*" element={<AuthPage onAuth={onAuth} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  const role = auth.user.role;
  const isAdmin = role === "Admin";
  const canSeeInventory = role !== "Worker";

  return (
    <BrowserRouter>
      <Shell auth={auth} setAuth={setAuth}>
        <Routes>
          <Route path="/" element={<OverviewPage auth={auth} />} />
          <Route path="/tasks" element={<TasksPage auth={auth} />} />
          <Route path="/yolo" element={<YoloPage />} />
          <Route path="/settings" element={<SettingsPage auth={auth} />} />
           <Route path="/tasks/:id" element={<TaskDetailPage auth={auth} />} />

          {canSeeInventory && <Route path="/materials" element={<MaterialsPage auth={auth} />} />}
          {canSeeInventory && <Route path="/transactions" element={<TransactionsPage auth={auth} />} />}

          {isAdmin && <Route path="/people" element={<PeoplePage auth={auth} />} />}
          {isAdmin && <Route path="/activity" element={<ActivityPage />} />}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}