const http = require("http");
const clients = {};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const cameraId = pathParts[0]; // e.g., cam1

  // FFmpeg pushes the MJPEG stream via POST
  if (req.method === "POST") {
    console.log(`📥 Receiving MJPEG stream for camera: ${cameraId}`);

    let buffer = Buffer.alloc(0);

    req.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      // MJPEG frame detection (JPEG frames start with 0xFFD8 and end with 0xFFD9)
      while (true) {
        const start = buffer.indexOf(Buffer.from([0xff, 0xd8]));
        const end = buffer.indexOf(Buffer.from([0xff, 0xd9]), start + 1);

        if (start !== -1 && end !== -1) {
          const frame = buffer.slice(start, end + 2);
          buffer = buffer.slice(end + 2);

          if (clients[cameraId]) {
            clients[cameraId].forEach((clientRes) => {
              clientRes.write(`--frame\r\n`);
              clientRes.write("Content-Type: image/jpeg\r\n");
              clientRes.write(`Content-Length: ${frame.length}\r\n\r\n`);
              clientRes.write(frame);
              clientRes.write("\r\n");
            });
          }
        } else {
          break;
        }
      }
    });

    req.on("end", () => {
      console.log(`📴 Stream ended for camera: ${cameraId}`);
      if (clients[cameraId]) {
        clients[cameraId].forEach((clientRes) => clientRes.end());
        clients[cameraId] = [];
      }
    });

    return;
  }

  // MJPEG GET stream clients (e.g., browser, React dashboard)
  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame", // must match the one used in frames
    "Cache-Control": "no-cache",
    Connection: "close",
    Pragma: "no-cache",
  });

  if (!clients[cameraId]) clients[cameraId] = [];
  clients[cameraId].push(res);

  req.on("close", () => {
    clients[cameraId] = clients[cameraId].filter((r) => r !== res);
  });
});

server.listen(8092, () => {
  console.log("📡 MJPEG Stream Server running on http://localhost:8092");
});
