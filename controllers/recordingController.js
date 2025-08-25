const fs = require("fs");
const path = require("path");

const recordingsBasePath = path.join(__dirname, "..", "recordings");

const getRecordingsByCameraId = async (req, res) => {
  const { cameraId } = req.params;
  const cameraFolder = path.join(recordingsBasePath, cameraId);

  try {
    if (!fs.existsSync(cameraFolder)) {
      return res.status(404).json({ message: "No recordings found." });
    }

    const files = fs
      .readdirSync(cameraFolder)
      .filter((file) => file.endsWith(".mp4"));

    // ✅ Sort and return recordings
    const recordings = files
      .map((filename) => {
        const stats = fs.statSync(path.join(cameraFolder, filename));
        return {
          filename,
          timestamp: stats.birthtime,
          url: `/recordings/${cameraId}/${filename}`,
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // newest first

    res.json(recordings);
  } catch (err) {
    console.error("Error fetching recordings:", err);
    res.status(500).json({ message: "Failed to fetch recordings." });
  }
};

module.exports = { getRecordingsByCameraId };
