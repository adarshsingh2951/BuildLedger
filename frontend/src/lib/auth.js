import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const initial = { user: null, ready: false };

export function useAuth() {
  const [auth, setAuth] = useState(initial);
  useEffect(() => {
    api
      .get("/auth/me")
      .then((response) => setAuth({ user: response.data, ready: true }))
      .catch(() => setAuth({ user: false, ready: true }));
  }, []);
  return [auth, setAuth];
}
