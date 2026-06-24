const PERMISSION_ACTIONS = ["view", "create", "edit", "delete"];

const ADMIN_MODULES = [
  { key: "dashboard", label: "Dashboard", actions: ["view"] },
  { key: "users", label: "Users", actions: ["view", "create", "edit", "delete"] },
  { key: "rides", label: "Rides", actions: ["view", "edit"] },
  { key: "passenger_rides", label: "Passenger Requests", actions: ["view"] },
  { key: "couriers", label: "Couriers", actions: ["view"] },
  { key: "live_tracking", label: "Live Tracking", actions: ["view"] },
  { key: "ads", label: "Ads", actions: ["view", "create", "edit", "delete"] },
  { key: "feedback", label: "Feedback", actions: ["view", "edit"] },
  { key: "legal", label: "Legal", actions: ["view", "edit"] },
  { key: "locations", label: "Locations", actions: ["view", "create", "edit", "delete"] },
  { key: "lookup_types", label: "Dropdown Types", actions: ["view", "create", "edit", "delete"] },
  { key: "subscription_plans", label: "Driver Plans", actions: ["view", "create", "edit", "delete"] },
  { key: "subscribed_users", label: "Subscribed Users", actions: ["view", "edit"] },
  { key: "subscription_payments", label: "Plan Payments", actions: ["view"] },
  { key: "vehicle_fares", label: "Vehicle Fares", actions: ["view", "create", "edit", "delete"] },
  { key: "admin_staff", label: "Admin Staff", actions: ["view", "create", "edit", "delete"] },
];

const MODULE_KEYS = ADMIN_MODULES.map((m) => m.key);

const emptyModulePermissions = () =>
  PERMISSION_ACTIONS.reduce((acc, action) => {
    acc[action] = false;
    return acc;
  }, {});

const buildAllPermissions = (value = true) => {
  const permissions = {};
  for (const mod of ADMIN_MODULES) {
    permissions[mod.key] = {};
    for (const action of mod.actions) {
      permissions[mod.key][action] = value;
    }
  }
  return permissions;
};

const isSuperAdmin = (admin) => {
  const role = String(admin?.role || "").trim();
  return role === "super_admin" || role === "admin";
};

const normalizePermissions = (raw = {}) => {
  const permissions = {};
  for (const mod of ADMIN_MODULES) {
    const source = raw?.[mod.key] || {};
    permissions[mod.key] = {};
    for (const action of mod.actions) {
      permissions[mod.key][action] = !!source?.[action];
    }
  }
  return permissions;
};

const resolveAdminPermissions = (admin) =>
  isSuperAdmin(admin) ? buildAllPermissions(true) : normalizePermissions(admin?.permissions);

const hasAdminPermission = (admin, module, action) => {
  if (!admin || admin.isActive === false) return false;
  if (isSuperAdmin(admin)) return true;
  const mod = ADMIN_MODULES.find((m) => m.key === module);
  if (!mod || !mod.actions.includes(action)) return false;
  return !!resolveAdminPermissions(admin)?.[module]?.[action];
};

const serializeAdminPublic = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  mobile: admin.mobile,
  role: admin.role || "staff",
  isActive: admin.isActive !== false,
  isSuperAdmin: isSuperAdmin(admin),
  permissions: resolveAdminPermissions(admin),
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

module.exports = {
  PERMISSION_ACTIONS,
  ADMIN_MODULES,
  MODULE_KEYS,
  emptyModulePermissions,
  buildAllPermissions,
  isSuperAdmin,
  normalizePermissions,
  resolveAdminPermissions,
  hasAdminPermission,
  serializeAdminPublic,
};
