//index.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const path = require("path");
const connectDB = require("./config/db");

const cameraRoutes = require("./routes/cameraRoutes");
const authRoutes = require("./routes/authRoutes");
const streamRoutes = require("./routes/streamRoutes");
const recordingsRoute = require("./routes/recordings");
const createInitialAdmin = require("./utils/initAdmin");

dotenv.config();
// Connect DB
connectDB().then(() => {
  // Create initial admin if not exists
  createInitialAdmin();
});

const app = express();

const corsOptions = {
  origin: ["http://localhost:3000", "https://cameratrackclient.vercel.app"],
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve recordings
app.use("/recordings", express.static(path.join(__dirname, "recordings")));

// Routes
app.use("/api/recordings", recordingsRoute);
app.use("/api/cameras", cameraRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/stream", streamRoutes);

// MJPEG Stream Proxy
app.get("/api/stream/:cameraId", (req, res) => {
  const { cameraId } = req.params;
  const streamUrl = `http://localhost:8092/${cameraId}`;

  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=ffserver",
    "Cache-Control": "no-cache",
    Connection: "close",
    Pragma: "no-cache",
  });

  http
    .get(streamUrl, (streamRes) => {
      streamRes.on("data", (chunk) => res.write(chunk));
      streamRes.on("end", () => res.end());
      streamRes.on("error", (err) => {
        console.error(`Stream error [${cameraId}]:`, err.message);
        res.end();
      });
    })
    .on("error", (err) => {
      console.error(`Proxy error [${cameraId}]:`, err.message);
      res.status(500).send("Stream unavailable");
    });
});

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
