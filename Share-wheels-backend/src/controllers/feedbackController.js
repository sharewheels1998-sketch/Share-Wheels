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
  submit: async (req, res) =>
    handle(res, () => feedbackService.submitFeedback(req.user._id, req.body)),
};
