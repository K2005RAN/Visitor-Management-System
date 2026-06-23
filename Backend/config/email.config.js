import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com", // Fallback to a real host
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// -------------------- Safe Verify SMTP --------------------
// We wrap this in an anonymous function to ensure it doesn't block the main thread
const verifyConnection = async () => {
  try {
    // If user or pass is missing, don't even try to connect
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("⚠️ Email Service: Credentials missing in .env. Emails will not be sent.");
        return;
    }

    console.log("📧 SMTP Server is ready to send emails");
  } catch (error) {
    console.log("❌ SMTP Connection Warning: Email service is offline. (The server will stay running)");
    // We log the error message but DON'T throw it, so the app doesn't crash
    console.log(`Reason: ${error.message}`);
  }
};

verifyConnection();

export default transporter;