const { hasAdminPermission } = require("../constants/adminPermissions");

const requireAdminPermission = (module, action) => (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  if (!hasAdminPermission(req.admin, module, action)) {
    return res.status(403).json({
      message: "You do not have permission for this action",
      module,
      action,
    });
  }
  return next();
};

module.exports = requireAdminPermission;
