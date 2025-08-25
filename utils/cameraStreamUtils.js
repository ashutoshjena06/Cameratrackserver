//cameraStreamUtils.js

const { spawn } = require("child_process");
const activeStreams = new Map(); // cameraId → ChildProcess

/**
 * Start the camera streaming process via FFmpeg.
 * @param {string} cameraId
 * @param {string} streamCommand  Full FFmpeg command as string (from DB)
 */
function startCameraStream(cameraId, streamCommand) {
 // console.log("startCameraStream", cameraId, streamCommand);
 
  if (activeStreams.has(cameraId)) return;

  // Remove "ffmpeg" from the start if present
  const cmd = streamCommand.trim();
  const parts = cmd.startsWith("ffmpeg")
    ? cmd.split(" ").slice(1)
    : cmd.split(" ");

  // console.log(`Spawning FFmpeg for ${cameraId}: ffmpeg ${parts.join(" ")}`);
  const proc = spawn("ffmpeg", parts, { env: process.env, shell: true });

  // proc.stderr.on("data", (d) =>
  //   console.error(`[FFmpeg ${cameraId}]`, d.toString())
  // );
  proc.on("close", (code) => {
    console.log(`FFmpeg ${cameraId} exited (${code})`);
    activeStreams.delete(cameraId);
  });
  proc.on("error", (err) => {
    console.error(`Failed to start FFmpeg for ${cameraId}:`, err);
    activeStreams.delete(cameraId);
  });

  activeStreams.set(cameraId, proc);
  //console.log("startCameraStream--activeStreams", activeStreams);
}

/**
 * Stop the camera streaming process.
 * @param {string} cameraId
 */
function stopCameraStream(cameraId) {
//console.log("stopCameraStream", cameraId);
 // console.log("activeStreams", activeStreams);
  const proc = activeStreams.get(cameraId);

  if (!proc) {
    console.log(`No active stream found for camera ${cameraId}`);
    return;
  }

  const pid = proc.pid;
 // console.log(`Force-killing camera stream for ${cameraId} (PID ${pid})`);
  require("child_process").exec(`taskkill /PID ${pid} /F /T`, (err) => {
    if (!err) {
      console.log(`Force-killed camera stream for ${cameraId} (PID ${pid})`);
    } else {
      console.log(`taskkill failed for ${cameraId} (PID ${pid})`);
    }
    activeStreams.delete(cameraId);
  });

  // Remove from map immediately to avoid double-kill
  activeStreams.delete(cameraId);
}

/**
 * Get IDs of cameras currently streaming.
 * @returns {string[]}
 */
function getActiveStreams() {
  return Array.from(activeStreams.keys());
}

// Cleanup on exit
process.on("exit", () => {
  console.log("Cleaning up all camera streams...");
  for (const proc of activeStreams.values()) {
    proc.kill("SIGKILL");
  }
});
process.on("SIGINT", () => {
  console.log("Received SIGINT; cleaning up camera streams...");
  process.exit(0);
});

module.exports = {
  startCameraStream,
  stopCameraStream,
  getActiveStreams,
  activeStreams,
};
