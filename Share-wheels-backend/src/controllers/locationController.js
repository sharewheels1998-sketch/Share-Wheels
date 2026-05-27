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
  getActiveLocations: async (_req, res) =>
    handle(res, () => locationService.listActiveLocations()),
};
