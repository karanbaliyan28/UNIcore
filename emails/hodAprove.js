export const hodFinalApprovedTemplate = (
  studentName,
  assignmentTitle,
  remarks,
  assignmentId
) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2 style="color: #16a34a;">Final Approval from HOD ✔️</h2>

      <p>Hello <strong>${studentName}</strong>,</p>

      <p>Your assignment <strong>"${assignmentTitle}"</strong> has been 
      <span style="color: #16a34a; font-weight: bold;">APPROVED by the HOD</span>.</p>

      ${
        remarks
          ? `<p><strong>Final Remarks:</strong> ${remarks}</p>`
          : ""
      }

      <p>You can view the assignment here:</p>
      <a href="${process.env.APP_BASE_URL}/student/assignments/${assignmentId}" 
         style="color: #2563eb; text-decoration: none;">
        View Assignment
      </a>

      <p style="margin-top: 20px;">Best Regards,<br/>UNIcore Team</p>
    </div>
  `;
};
