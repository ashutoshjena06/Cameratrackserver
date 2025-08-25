const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("../controllers/authController");

// Auth Routes
console.log("Auth routes loaded");

router.post("/register", registerAdmin); // Optional
router.post("/login", loginAdmin);
// Forgot Password Flow
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.get("/test", (req, res) => {
  res.send("Auth route working ✅");
});

module.exports = router;
