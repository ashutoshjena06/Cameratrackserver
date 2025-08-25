const express = require("express");
const router = express.Router();
const {
  getRecordingsByCameraId,
} = require("../controllers/recordingController");

router.get("/:cameraId", getRecordingsByCameraId);

module.exports = router;
