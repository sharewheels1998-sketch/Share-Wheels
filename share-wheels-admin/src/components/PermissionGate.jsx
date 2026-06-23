import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function PermissionGate({ module, action = "view", children, fallback = null }) {
  const { can } = useAdminAuth();
  if (!can(module, action)) return fallback;
  return children;
}

export function PermissionRoute({ module, children }) {
  const { canView } = useAdminAuth();
  if (!canView(module)) return <Navigate to="/" replace />;
  return children;
}
