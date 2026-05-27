const locationService = require("../services/locationService");

const handle = async (res, fn) => {
  try {
    const result = await fn();
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  listLocations: async (_req, res) => handle(res, () => locationService.listAllLocations()),
  createLocation: async (req, res) => handle(res, () => locationService.createLocation(req.body)),
  updateLocation: async (req, res) =>
    handle(res, () => locationService.updateLocation(req.params.id, req.body)),
  deleteLocation: async (req, res) =>
    handle(res, () => locationService.deleteLocation(req.params.id)),
  bulkUpsertLocations: async (req, res) =>
    handle(res, () => locationService.bulkUpsertLocations(req.body?.names)),
  clearAllLocations: async (_req, res) =>
    handle(res, () => locationService.clearAllLocations()),
};
