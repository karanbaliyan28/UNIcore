// utils/email.js
import { Resend } from "resend";

let resendInstance = null;

const getResend = () => {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not defined in environment variables");
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: "University Portal <onboarding@resend.dev>",
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      throw error;
    }

    console.log("📧 Email sent successfully to:", to);
    console.log("✅ Email ID:", data?.id);

    return data;
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    console.error("Full error:", JSON.stringify(err, null, 2));
    throw err;
  }
};
