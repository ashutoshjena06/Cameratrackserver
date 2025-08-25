const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OtpVerification = require("../models/OtpVerification");
const sendEmail = require("../config/sendEmail");
require("dotenv").config();

// Admin Registration (Optional)
// Admin Registration (Manual Hashing)
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password manually
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with hashed password
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin", // optional if you have roles
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Error registering admin:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, "------", password);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    console.log("------>>> ", user);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("isMatch ", isMatch);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Helper: JWT Token Generator
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Step 1: Send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User with this email not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Expiry: 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP in DB
    await OtpVerification.findOneAndUpdate(
      { email },
      { email, otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send OTP email
    await sendEmail({
      to: email,
      subject: "CameraTrackerPro Password Reset OTP",
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #2c3e50; }
        .header h2 { margin: 0; }
        .content { margin-top: 20px; color: #555; line-height: 1.6; }
        .otp { font-size: 24px; font-weight: bold; color: #27ae60; text-align: center; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>CameraTrackerPro</h2>
        </div>
        <div class="content">
          <p>Hi <strong>${email}</strong>,</p>
          <p>We received a request to reset your password. Use the OTP below to reset it. This OTP will expire in 5 minutes.</p>
          <div class="otp">${otp}</div>
          <p>If you did not request a password reset, please ignore this email or contact support.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CameraTrackerPro. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `,
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Step 2: Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OtpVerification.findOne({ email, otp });

    if (!record) return res.status(400).json({ message: "Invalid OTP" });

    if (record.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired" });

    res.status(200).json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Step 3: Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = await OtpVerification.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: "Invalid OTP" });
    if (record.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    // Delete OTP record after successful reset
    await OtpVerification.deleteOne({ email, otp });

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
