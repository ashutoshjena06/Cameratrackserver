// utils/sendEmail.js
const nodemailer = require("nodemailer");
require("dotenv").config();
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // or your actual SMTP server
  port: 587, // or 465 for SSL
  secure: false, // true for port 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 *  user: "ashutosh.jena@raagvitech.com",
      pass: "qsmq ehnu maxg rzcs",
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    //    console.log("MAIL_USER:", process.env.MAIL_USER);
    //   console.log("MAIL_PASS:", process.env.MAIL_PASS);

    const mailOptions = {
      from: ` "FitFusion" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw new Error("Failed to send email");
  }
};

module.exports = sendEmail;
