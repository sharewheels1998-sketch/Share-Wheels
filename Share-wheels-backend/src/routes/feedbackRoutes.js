const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const feedbackController = require("../controllers/feedbackController");

const router = express.Router();

router.use(authMiddleware);
router.post("/", feedbackController.submit);

module.exports = router;
