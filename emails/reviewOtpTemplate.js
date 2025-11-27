// email/reviewOtpTemplate.js

export const reviewOtpTemplate = (
  profName,
  assignmentTitle,
  otp,
  signaturePreview
) => {
  return `
    <div style="font-family: Arial; padding: 20px;">

      <h2 style="color: #4f46e5;">OTP Verification Required</h2>

      <p>Hello <strong>${profName}</strong>,</p>

      <p>You have initiated a review for the assignment:</p>

      <p><strong>${assignmentTitle}</strong></p>

      <p>Your One-Time Password (OTP) for verification is:</p>

      <div style="
        font-size: 28px; 
        font-weight: bold; 
        color: #1d4ed8; 
        letter-spacing: 4px; 
        margin: 20px 0;
      ">
        ${otp}
      </div>

      <p>This OTP is valid for <strong>10 minutes</strong>.</p>

      <hr style="margin: 20px 0;" />

      <h3 style="color: #4b5563;">Signature Preview</h3>

      ${signaturePreview}

      <hr style="margin: 20px 0;" />

      <p>If you did not request this, please ignore the email.</p>

      <p style="margin-top: 25px;">Regards,<br/>UNIcore Team</p>
    </div>
  `;
};
