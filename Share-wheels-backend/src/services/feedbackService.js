const Feedback = require("../models/feedbackModel");

const normalizeMessage = (msg) => String(msg || "").trim();

const submitFeedback = async (userId, body) => {
  const message = normalizeMessage(body?.message);
  if (!message || message.length < 3) {
    return {
      status: 400,
      body: { success: false, message: "Please enter at least 3 characters of feedback" },
    };
  }
  const category = body?.category || "general";
  const allowed = ["general", "bug", "feature", "ride", "other"];
  const feedback = await Feedback.create({
    userId,
    message,
    category: allowed.includes(category) ? category : "general",
  });
  return {
    status: 201,
    body: {
      success: true,
      message: "Thank you! Your feedback has been sent to the admin team.",
      feedback,
    },
  };
};

const listFeedbackForAdmin = async (query = {}) => {
  const filter = {};
  if (query.status && query.status !== "all") filter.status = query.status;
  const feedbacks = await Feedback.find(filter)
    .populate("userId", "name email mobile userNo profile_img")
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(query.limit) || 100, 200))
    .lean();
  return { status: 200, body: { success: true, feedbacks } };
};

const updateFeedbackStatus = async (id, body) => {
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    return { status: 404, body: { success: false, message: "Feedback not found" } };
  }
  const allowed = ["new", "reviewed", "resolved"];
  if (body?.status && allowed.includes(body.status)) {
    feedback.status = body.status;
  }
  if (body?.adminNote !== undefined) {
    feedback.adminNote = String(body.adminNote || "").trim();
  }
  await feedback.save();
  return { status: 200, body: { success: true, feedback } };
};

module.exports = {
  submitFeedback,
  listFeedbackForAdmin,
  updateFeedbackStatus,
};
