export const userUpdatedTemplate = (name, email, role, department) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2 style="color: #4f46e5;">Account Updated</h2>

      <p>Hello <strong>${name}</strong>,</p>
      <p>Your user account details have been updated by the system administrator.</p>

      <h3>Updated Details:</h3>
      <div style="background: #f3f4f6; padding: 12px; border-radius: 8px;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Department:</strong> ${department}</p>
      </div>

      <p>If you did not request this update, please contact the admin immediately.</p>

      <p style="margin-top: 20px;">Regards,<br/>University Admin Team</p>
    </div>
  `;
};
