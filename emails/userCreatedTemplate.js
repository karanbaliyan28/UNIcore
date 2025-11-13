export const userCreatedTemplate = (name, email, password, role, department) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2 style="color: #4f46e5;">Welcome to University Portal</h2>
      
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your account has been created successfully.</p>

      <h3>Your Login Credentials:</h3>
      <div style="background: #f3f4f6; padding: 12px; border-radius: 8px;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Department:</strong> ${department}</p>
      </div>

      <p>Please log in and change your password immediately.</p>

      <p style="margin-top: 20px;">Regards,<br/>University Admin Team</p>
    </div>
  `;
};
