const adminStaffService = require("../services/adminStaffService");

const handle = async (res, fn) => {
  try {
    const result = await fn();
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: "Error", error: err.message });
  }
};

module.exports = {
  meta: async (req, res) => handle(res, () => adminStaffService.getStaffMeta()),
  list: async (req, res) => handle(res, () => adminStaffService.listStaff()),
  create: async (req, res) =>
    handle(res, () => adminStaffService.createStaff(req.admin._id, req.body)),
  update: async (req, res) =>
    handle(res, () => adminStaffService.updateStaff(req.admin._id, req.params.id, req.body)),
  remove: async (req, res) =>
    handle(res, () => adminStaffService.deleteStaff(req.admin._id, req.params.id)),
};
