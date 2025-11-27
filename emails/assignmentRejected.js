// email/assignmentRejected.js

export const assignmentRejectedTemplate = (
  studentName,
  assignmentTitle,
  remarks,
  assignmentId
) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2 style="color: #dc2626;">Assignment Rejected ❌</h2>

      <p>Hello <strong>${studentName}</strong>,</p>

      <p>Your assignment <strong>"${assignmentTitle}"</strong> has been 
      <span style="color: #dc2626; font-weight: bold;">REJECTED</span>.</p>

      <p><strong>Feedback:</strong> ${remarks}</p>

      <p>Please improve the assignment and resubmit here:</p>
      <a href="${process.env.APP_BASE_URL}/student/assignments/${assignmentId}" 
         style="color: #2563eb; text-decoration: none;">
        Resubmit Assignment
      </a>

      <p style="margin-top: 20px;">Regards,<br/>UNIcore Team</p>
    </div>
  `;
};
