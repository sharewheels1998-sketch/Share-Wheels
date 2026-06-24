export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete"];

export const ADMIN_MODULES = [
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

export const ROUTE_MODULE_MAP = {
  "/": "dashboard",
  "/users": "users",
  "/rides": "rides",
  "/passenger-rides": "passenger_rides",
  "/couriers": "couriers",
  "/live-tracking": "live_tracking",
  "/ads": "ads",
  "/feedback": "feedback",
  "/legal": "legal",
  "/locations": "locations",
  "/lookup-types": "lookup_types",
  "/subscription-plans": "subscription_plans",
  "/subscribed-users": "subscribed_users",
  "/subscription-payments": "subscription_payments",
  "/vehicle-fares": "vehicle_fares",
  "/admin-staff": "admin_staff",
};

export const buildEmptyPermissions = () => {
  const permissions = {};
  for (const mod of ADMIN_MODULES) {
    permissions[mod.key] = {};
    for (const action of mod.actions) {
      permissions[mod.key][action] = false;
    }
  }
  return permissions;
};

export const buildAllPermissions = (value = true) => {
  const permissions = {};
  for (const mod of ADMIN_MODULES) {
    permissions[mod.key] = {};
    for (const action of mod.actions) {
      permissions[mod.key][action] = value;
    }
  }
  return permissions;
};

export const canAccessModule = (admin, module) => {
  if (!admin) return false;
  if (admin.isSuperAdmin) return true;
  return !!admin.permissions?.[module]?.view;
};

export const hasPermission = (admin, module, action) => {
  if (!admin) return false;
  if (admin.isSuperAdmin) return true;
  return !!admin.permissions?.[module]?.[action];
};
