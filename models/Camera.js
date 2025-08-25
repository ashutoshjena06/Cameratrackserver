const mongoose = require("mongoose");

const cameraSchema = new mongoose.Schema(
  {
    cameraId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    streamUrl: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["webcam", "ip"],
      required: true,
    },
    deviceName: {
      type: String,
      required: function() { return this.type === "webcam"; },
    },
    audioDeviceName: { type: String, required: false },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    streamCommand: { type: String, required: true },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Camera", cameraSchema);
