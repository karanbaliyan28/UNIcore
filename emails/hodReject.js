export const hodFinalRejectedTemplate = (
  studentName,
  assignmentTitle,
  remarks,
  assignmentId
) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2 style="color: #dc2626;">Assignment Rejected by HOD ❌</h2>

      <p>Hello <strong>${studentName}</strong>,</p>

      <p>Your assignment <strong>"${assignmentTitle}"</strong> was 
      <span style="color: #dc2626; font-weight: bold;">REJECTED by the HOD</span>.</p>

      <p><strong>Reason:</strong> ${remarks}</p>

      <p>Please correct the issues and resubmit.</p>

      <a href="${process.env.APP_BASE_URL}/student/assignments/${assignmentId}" 
         style="color: #2563eb; text-decoration: none;">
        View Assignment
      </a>

      <p style="margin-top: 20px;">Regards,<br/>UNIcore Team</p>
    </div>
  `;
};
