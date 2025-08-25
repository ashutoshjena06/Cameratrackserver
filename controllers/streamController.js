//streamController
const Camera = require("../models/Camera");
const { stopCameraStream, startCameraStream } = require("../utils/cameraStreamUtils");
const {
  startRecording,
  stopRecording,
  getRecordingCameras,
} = require("../utils/ffmpegUtils");

// Live stream redirection (for MJPEG/HTTP preview)
const http = require("http");

const getStream = async (req, res) => {
  console.log("🔁 getStream called");
  try {
    const { cameraId } = req.params;
    console.log("cameraId", cameraId);
    const camera = await Camera.findOne({ cameraId });
   // console.log("camera", camera);
    if (!camera || camera.status !== "Active") {
      return res.status(404).json({ message: "Camera not found or inactive" });
    }

    const streamUrl = camera.streamUrl;

    // Avoid redirect loop if stream URL is hitting same endpoint
    if (streamUrl.includes("/api/stream")) {
      return res
        .status(400)
        .json({ message: "Invalid stream URL - causes redirect loop" });
    }

    // Set MJPEG stream headers once
    res.writeHead(200, {
      "Content-Type": "multipart/x-mixed-replace; boundary=frame",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      Pragma: "no-cache",
    });

    // Pipe stream from MJPEG source to client
    const proxyReq = http.get(streamUrl, (streamRes) => {
      streamRes.on("data", (chunk) => {
        if (!res.writableEnded) res.write(chunk);
      });

      streamRes.on("end", () => {
        console.log("📴 Stream ended");
        if (!res.writableEnded) res.end();
      });

      streamRes.on("error", (err) => {
        console.error("⛔ Stream read error:", err.message);
        if (!res.writableEnded) res.end();
      });
    });

    proxyReq.on("error", (err) => {
      console.error("❌ Proxy connection error:", err.message);
      if (!res.headersSent && !res.writableEnded) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Stream unavailable");
      } else if (!res.writableEnded) {
        res.end();
      }
    });
  } catch (err) {
    console.error("🔥 Server error in getStream:", err.message);
    if (!res.headersSent && !res.writableEnded) {
      res.status(500).json({ message: "Unable to load stream" });
    }
  }
};

// Start recording a camera stream
const startCameraRecording = async (req, res) => {
  console.log("startCameraRecording", req.params);
  try {
    const { cameraId } = req.params;
    console.log("startCameraRecording cameraId ==> ", cameraId);
    const camera = await Camera.findById(cameraId);
   // console.log("camera", camera);
    // if (!camera || camera.status !== "Active") {
    //   return res.status(404).json({ message: "Camera not found or inactive" });
    // }
    stopCameraStream(camera.cameraId);
    setTimeout(() => {
      startRecording(camera); // Give FFmpeg time to release webcam
    }, 500); // Wait 0.5s before recording

    res.json({ message: `Recording started for camera ${cameraId}` });
  } catch (err) {
    console.error("Start recording error:", err.message);
    res.status(500).json({ message: "Failed to start recording" });
  }
};

// Stop recording a camera stream
const stopCameraRecording = async (req, res) => {
  try {
    console.log("stopCameraRecording", req.params);
    const { cameraId } = req.params;
    console.log("stopCameraRecording cameraId ==> ", cameraId);
  const camera = await Camera.findById(cameraId);
    stopRecording(camera.cameraId);
      // Restart stream only if camera is still marked Active
      // Restart live stream if still marked Active
    if (camera.status === "Active") {
      setTimeout(() => {
        startCameraStream(camera.cameraId, camera.streamCommand);
      }, 1000); // Wait 1s to ensure recording process exits
    }
    res.json({ message: `Recording stopped for camera ${cameraId}` });
  } catch (err) {
    console.error("Stop recording error:", err.message);
    res.status(500).json({ message: "Failed to stop recording" });
  }
};

// List all cameras that are currently recording
const listActiveRecordings = (req, res) => {
  try {
    const activeCameras = getRecordingCameras();
    res.json({ activeCameras });
  } catch (err) {
    res.status(500).json({ message: "Error listing recordings" });
  }
};

module.exports = {
  getStream,
  startCameraRecording,
  stopCameraRecording,
  listActiveRecordings,
};
