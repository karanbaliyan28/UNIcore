// utils/email.js
import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL, // your personal Gmail
        pass: process.env.ADMIN_EMAIL_PASSWORD, // Gmail App Password
      },
    });

    await transporter.sendMail({
      from: `"University Portal" <${process.env.ADMIN_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent to:", to);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
  }
};
