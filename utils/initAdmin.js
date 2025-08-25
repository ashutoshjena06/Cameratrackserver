const User = require("../models/User");
const bcrypt = require("bcryptjs");

const createInitialAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("✅ Admin already exists, skipping creation.");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    // Create admin user
    const admin = await User.create({
      name: process.env.ADMIN_NAME,
      email: adminEmail,
      password: hashedPassword,
      role: "admin", // optional, if you have a role field
    });

    console.log(`✅ Admin created: ${admin.email}`);
  } catch (err) {
    console.error("❌ Failed to create admin:", err.message);
  }
};

module.exports = createInitialAdmin;
