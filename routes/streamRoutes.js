const express = require("express");
const {
  getStream,
  startCameraRecording,
  stopCameraRecording,
  listActiveRecordings,
} = require("../controllers/streamController");

const router = express.Router();

// View camera live stream (redirects to stream URL)
router.get("/:cameraId", getStream);

// Start recording camera stream
router.post("/:cameraId/start", startCameraRecording);

// Stop recording camera stream
router.post("/:cameraId/stop", stopCameraRecording);

// List currently recording cameras
router.get("/recording", listActiveRecordings);

module.exports = router;
