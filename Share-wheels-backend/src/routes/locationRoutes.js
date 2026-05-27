const express = require("express");
const locationController = require("../controllers/locationController");

const router = express.Router();

router.get("/active", locationController.getActiveLocations);

module.exports = router;
