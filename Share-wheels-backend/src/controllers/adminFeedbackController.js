const feedbackService = require("../services/feedbackService");

const handle = async (res, fn) => {
  try {
    const result = await fn();
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  list: async (req, res) => handle(res, () => feedbackService.listFeedbackForAdmin(req.query)),
  update: async (req, res) =>
    handle(res, () => feedbackService.updateFeedbackStatus(req.params.id, req.body)),
};
