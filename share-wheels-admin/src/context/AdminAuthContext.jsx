import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAdminMe } from "../api/client";
import { canAccessModule, hasPermission } from "../constants/adminPermissions";

const AdminAuthContext = createContext(null);

const readStoredAdmin = () => {
  try {
    return JSON.parse(localStorage.getItem("admin") || "null");
  } catch {
    return null;
  }
};

export function AdminAuthProvider({ children }) {
  const [admin, setAdminState] = useState(() => readStoredAdmin());

  const setAdmin = useCallback((next) => {
    setAdminState(next);
    if (next) localStorage.setItem("admin", JSON.stringify(next));
    else localStorage.removeItem("admin");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    getAdminMe()
      .then((res) => {
        if (res?.admin) setAdminState(res.admin);
      })
      .catch(() => {});
  }, []);

  const can = useCallback(
    (module, action = "view") => hasPermission(admin, module, action),
    [admin]
  );

  const canView = useCallback((module) => canAccessModule(admin, module), [admin]);

  const value = useMemo(
    () => ({
      admin,
      setAdmin,
      isSuperAdmin: !!admin?.isSuperAdmin,
      can,
      canView,
    }),
    [admin, setAdmin, can, canView]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
