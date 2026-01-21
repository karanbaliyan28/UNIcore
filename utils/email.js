import nodemailer from "nodemailer";

let transporterInstance = null;

const getTransporter = () => {
  if (!transporterInstance) {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASSWORD) {
      throw new Error("SMTP environment variables are not fully defined");
    }

    transporterInstance = nodemailer.createTransport({
      // host:smtp.gmail.com,
      service:"gmail",
      port: 587,
      secure: false, // true for 465, false for others
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD,
      },
    });
  }

  return transporterInstance;
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"University Portal" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent successfully to:", to);
    console.log("✅ Message ID:", info.messageId);

    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    console.error("Full error:", JSON.stringify(err, null, 2));
    throw err;
  }
};
