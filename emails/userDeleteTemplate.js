export const userDeletedTemplate = (name) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2 style="color: #dc2626;">Account Removed</h2>

      <p>Hello <strong>${name}</strong>,</p>
      <p>Your account has been <strong>deleted</strong> from the University Portal.</p>

      <p>If you think this is a mistake, please contact the administrator as soon as possible.</p>

      <p style="margin-top: 20px;">Regards,<br/>University Admin Team</p>
    </div>
  `;
};
