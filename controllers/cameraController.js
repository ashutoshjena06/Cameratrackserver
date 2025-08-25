//cameracontroller.js
const Camera = require("../models/Camera");
const {
  startCameraStream,
  stopCameraStream,
  getActiveStreams,
} = require("../utils/cameraStreamUtils");
// Add Camera
const addCamera = async (req, res) => {
  try {
    const { cameraId,type ,audioDeviceName,deviceName, name, location,streamCommand, streamUrl, status } = req.body;
    const camera = await Camera.create({
      cameraId,
      name,
      location,
      streamUrl,
      streamCommand,
      status,
      type,
      deviceName,
      audioDeviceName,
    });
    res.status(201).json(camera);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding camera", error: err.message });
  }
};

// Update Camera
const updateCamera = async (req, res) => {
  try {
    const camera = await Camera.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!camera) return res.status(404).json({ message: "Camera not found" });
    res.json(camera);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating camera", error: err.message });
  }
};

// Delete Camera (Soft Delete)
const deleteCamera = async (req, res) => {
  try {
    const camera = await Camera.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!camera) return res.status(404).json({ message: "Camera not found" });
    res.json({ message: "Camera deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting camera", error: err.message });
  }
};

// List All Cameras (Filter out soft-deleted)
const getAllCameras = async (req, res) => {
  try {
    const cameras = await Camera.find({ isDeleted: false });
    res.json(cameras);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching cameras", error: err.message });
  }
};

// Search Cameras by any field (partial and case-insensitive)
const searchCameras = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchRegex = new RegExp(query, "i"); // case-insensitive

    const results = await Camera.find({
      isDeleted: false,
      $or: [
        { cameraId: searchRegex },
        { name: searchRegex },
        { location: searchRegex },
        { type: searchRegex },
        { status: searchRegex },
        { deviceName: searchRegex },
        { audioDeviceName: searchRegex },
      ],
    });
    console.log("results", results);
    res.json(results);
  } catch (err) {
    console.error("Error searching cameras:", err);
    res.status(500).json({ message: "Error searching cameras" });
  }
};


// Get Single Camera
const getCameraById = async (req, res) => {
  try {
   // console.log("getCameraById", req.params.id);
    const camera = await Camera.findOne({_id:req.params.id});
   // console.log("getCameraById camera==>", camera);
    if (!camera || camera.isDeleted)
      return res.status(404).json({ message: "Camera not found" });
    res.json(camera);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching camera", error: err.message });
  }
};

// ✅ Start Camera (sets status to Active)
// ✅ Start Camera (sets status to Active and starts streaming process)
const startCamera = async (req, res) => {
  console.log("startCamera", req.params.id);
  try {
    const camera = await Camera.findById(req.params.id);
   // console.log("camera from start camera", camera);
    if (!camera) return res.status(404).json({ message: "Camera not found" });

    // Start the streaming process
    startCameraStream(camera.cameraId, camera.streamCommand);

    // Update database status
    camera.status = "Active";
    await camera.save();

    res.json({ message: "Camera started", camera });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error starting camera", error: err.message });
  }
};

// ⏹️ Stop Camera (sets status to Inactive and stops streaming process)
const stopCamera = async (req, res) => {
  console.log("stopCamera", req.params.id);
  try {
    const camera = await Camera.findById(req.params.id);
    // console.log("camera", camera);
    if (!camera) return res.status(404).json({ message: "Camera not found" });

    // Stop the streaming process
    stopCameraStream(camera.cameraId);

    // Update database status
    camera.status = "Inactive";
    await camera.save();

    res.json({ message: "Camera stopped", camera });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error stopping camera", error: err.message });
  }
};

// Get active streaming cameras
const getActiveStreamingCameras = (req, res) => {
  try {
    const activeStreams = getActiveStreams();
    res.json({ activeStreams });
  } catch (err) {
    res.status(500).json({ message: "Error getting active streams" });
  }
};

// 🎥 Start Recording (you can later implement actual recording logic)
// const startRecording = async (req, res) => {
//   try {
//     // This is just a mock — ideally you trigger FFmpeg or another tool here
//     res.json({ message: `Recording started for camera ${req.params.id}` });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Error starting recording", error: err.message });
//   }
// };

// // ⏹️ Stop Recording (mock)
// const stopRecording = async (req, res) => {
//   try {
//     res.json({ message: `Recording stopped for camera ${req.params.id}` });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Error stopping recording", error: err.message });
//   }
// };

module.exports = {
  addCamera,
  updateCamera,
  deleteCamera,
  getAllCameras,
  getCameraById,
  startCamera,
  stopCamera,
  // startRecording,
  // stopRecording,
  getActiveStreamingCameras,
  searchCameras
};
