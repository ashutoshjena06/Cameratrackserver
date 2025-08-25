//ffmpegUtils.js
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const activeRecordings = new Map(); // cameraId → ffmpeg process
const recordingsDir = path.join(__dirname, "..", "recordings");

if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

const startRecording = (camera) => {
  if (activeRecordings.has(camera.cameraId)) {
    console.log(`⚠️ Recording already in progress for camera ${camera.cameraId}`);
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const cameraFolder = path.join(recordingsDir, camera.cameraId);
  if (!fs.existsSync(cameraFolder)) {
    fs.mkdirSync(cameraFolder, { recursive: true });
  }

  const outputFile = path.join(cameraFolder, `${timestamp}.mp4`);
  console.log(`🎥 FFmpeg input: ${camera.deviceName || camera.streamUrl}`);
  console.log(`📁 Output: ${outputFile}`);

  let ffmpegArgs;

  if (camera.type === "webcam") {

    const input = camera.audioDeviceName
    ? `video=${camera.deviceName}:audio=${camera.audioDeviceName}`
    : `video=${camera.deviceName}`;
    ffmpegArgs = [
      "-f", "dshow",
      "-framerate", "30",
      "-i", input,
      "-vcodec", "libx264",
      "-preset", "ultrafast",
      "-pix_fmt", "yuv420p",
      "-crf", "23",
      "-movflags", "+faststart",
      "-y",
  
    ];
    if (camera.audioDeviceName) {
      ffmpegArgs.push("-acodec", "aac");
    }
    
    ffmpegArgs.push("-f", "mp4");
    ffmpegArgs.push(outputFile);
  } else if (camera.type === "ip") {
    ffmpegArgs = [
      "-i", camera.streamUrl,
      "-vcodec", "libx264",
      "-preset", "ultrafast",
      "-pix_fmt", "yuv420p",
      "-crf", "23",
      "-movflags", "+faststart",
      "-y",
      outputFile
    ];
  } else {
    console.error(`❌ Unknown camera type: ${camera.type}`);
    return;
  }

  const ffmpeg = spawn("ffmpeg", ffmpegArgs, {
    stdio: ["pipe", "inherit", "pipe"]
  });

  ffmpeg.stderr.on("data", (data) => {
    console.log(`[FFmpeg][${camera.cameraId}]: ${data.toString()}`);
  });

  // Save info needed for stopRecording
  activeRecordings.set(camera.cameraId, {
    process: ffmpeg,
    filePath: outputFile,
  });

  ffmpeg.on("close", (code) => {
    console.log(`🛑 Recording stopped for camera ${camera.cameraId} (code ${code})`);

    // Validate the file with ffprobe
    exec(`ffprobe -v error -show_format -show_streams "${outputFile}"`, (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ FFprobe failed:`, stderr || err.message);
      } else {
        console.log(`📊 FFprobe output:\n${stdout}`);
      }
    });

    activeRecordings.delete(camera.cameraId);
  });

  //console.log(`✅ Started recording for camera ${camera.cameraId}`);
};


const stopRecording = (cameraId) => {
  const data = activeRecordings.get(cameraId);

  if (!data || !data.process) {
    console.log(`⚠️ No active recording for camera ${cameraId}`);
    return;
  }

  const process = data.process;

  try {
    console.log(`🛑 Sending 'q' to FFmpeg stdin to stop recording for camera ${cameraId}`);
    process.stdin.write("q"); // ✅ This is where it finalizes the .mp4 file
  } catch (err) {
    console.error(`❌ Failed to send 'q':`, err.message);
  }

  // Failsafe: Force kill if it doesn't stop in 10 seconds
  setTimeout(() => {
    if (!process.killed && process.exitCode === null) {
      console.warn(`⚠️ FFmpeg still running. Forcing kill for ${cameraId}`);
      exec(`taskkill /PID ${process.pid} /F /T`, (err) => {
        if (err) {
          console.error(`❌ Force kill failed:`, err.message);
        } else {
          console.log(`✅ Force kill successful`);
        }
        activeRecordings.delete(cameraId);
      });
    } else {
      // Already stopped gracefully
      console.log(`✅ FFmpeg process already exited for ${cameraId}, no need to force kill.`);
    }
  }, 10000);
  
};



const getRecordingCameras = () => {
  return Array.from(activeRecordings.keys());
};

module.exports = {
  startRecording,
  stopRecording,
  getRecordingCameras,
};
