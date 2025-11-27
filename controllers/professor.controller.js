import Assignment from "../models/assignment.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import crypto from "crypto";
import { assignmentApprovedTemplate } from "../emails/assignmentApproved.js";
import { assignmentRejectedTemplate } from "../emails/assignmentRejected.js";
import { reviewOtpTemplate } from "../emails/reviewOtpTemplate.js";
import { sendEmail } from "../utils/email.js";

// GET /professor/dashboard - FIXED COUNTS
export const getProfessorDashboard = async (req, res) => {
  try {
    const statusFilter = req.query.status || "all";
    const searchQuery = req.query.search || "";
    const sortBy = req.query.sort || "oldest";

    // Build query - include assignments where professor was the original reviewer
    let query = {
      $or: [
        { reviewerId: req.user.id },
        { "history.reviewerId": req.user.id }, // Include assignments professor has touched
      ],
      status: { $ne: "draft" },
    };

    // Apply status filter
    if (statusFilter !== "all") {
      query.status = statusFilter;
    }

    // Apply search filter
    if (searchQuery) {
      const students = await User.find({
        name: { $regex: searchQuery, $options: "i" },
      }).select("_id");

      query.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { studentId: { $in: students.map((s) => s._id) } },
      ];
    }

    // Count statistics - FIXED: Only count assignments in professor's queue
    const pending = await Assignment.countDocuments({
      reviewerId: req.user.id,
      status: "submitted",
    });

    const approved = await Assignment.countDocuments({
      $or: [
        { reviewerId: req.user.id, status: "approved" },
        { "history.reviewerId": req.user.id, "history.action": "approved" },
      ],
    });

    const rejected = await Assignment.countDocuments({
      $or: [
        { reviewerId: req.user.id, status: "rejected" },
        { "history.reviewerId": req.user.id, "history.action": "rejected" },
      ],
    });

    // FIXED: Count only assignments this professor forwarded
    const forwarded = await Assignment.countDocuments({
      status: "forwarded",
      history: {
        $elemMatch: {
          action: "forwarded",
          reviewerId: req.user.id,
        },
      },
    });

    const totalReviewed = approved + rejected + forwarded;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Sorting
    let sortOptions = { createdAt: 1 };
    if (sortBy === "newest") sortOptions = { createdAt: -1 };
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    if (sortBy === "title") sortOptions = { title: 1 };

    const assignments = await Assignment.find(query)
      .populate("studentId", "name email")
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const totalAssignments = await Assignment.countDocuments(query);
    const totalPages = Math.ceil(totalAssignments / limit);

    const unreadNotifications = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
    });

    res.render("professor/dashboard", {
      forwarded,
      pending,
      approved,
      rejected,
      totalReviewed,
      assignments,
      page,
      totalPages,
      statusFilter,
      searchQuery,
      sortBy,
      unreadNotifications,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).send("Error loading dashboard");
  }
};

// GET /professor/review/:id - BACK TO ORIGINAL (NO FORWARD HERE)
export const getReviewPage = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("studentId", "name email")
      .populate("reviewerId", "name");

    if (!assignment) return res.status(404).send("Assignment not found");

    res.render("professor/review", { assignment });
  } catch (err) {
    console.error("Review Page Error:", err);
    res.status(500).send("Error loading review page");
  }
};

// GET /professor/details/:id - WITH FORWARD OPTION FOR APPROVED
export const getAssignmentDetails = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("studentId", "name email")
      .populate("reviewerId", "name")
      .populate("history.reviewerId", "name department");

    if (!assignment) return res.status(404).send("Assignment not found");

    // Build forward list (HOD only)
    const forwardList = await User.find({
      department: req.user.department,
      role: "hod",
    }).select("name role");

    return res.render("professor/details", {
      assignment,
      forwardList,
      user: req.user,
    });
  } catch (err) {
    console.error("Details Page Error:", err);
    res.status(500).send("Error loading assignment details");
  }
};

// STEP 1 - Initiate Review (UNCHANGED)
export const initiateReview = async (req, res) => {
  try {
    const { remark, signature, decision } = req.body;
    const assignmentId = req.params.id;

    const signatureImage = req.file ? req.file.filename : null;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).send("Assignment not found");

    if (!signature && !signatureImage) {
      return res.status(400).send("Signature is required (text or image)");
    }

    if (!remark || !decision) {
      return res.status(400).send("Remark and decision are required");
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).send("Unauthorized user");

    user.reviewOtp = otp;
    user.reviewOtpExpires = Date.now() + 10 * 60 * 1000;

    user.tempReviewData = {
      assignmentId: assignment._id,
      decision,
      remark,
      signature: signature || null,
      signatureImage: signatureImage || null,
    };

    await user.save();

    const signaturePreview = signatureImage
      ? "<p><em>(Signature Image Uploaded)</em></p>"
      : `<p style="font-family: cursive; font-size: 24px; color: #4f46e5;">${signature}</p>`;

    await sendEmail({
      to: user.email,
      subject: "UNICore: Verify Assignment Review",
      html: reviewOtpTemplate(
        user.name,
        assignment.title,
        otp,
        signaturePreview
      ),
    });

    res.render("professor/verify-otp", {
      email: user.email,
      assignmentId,
    });
  } catch (err) {
    console.error("Initiate Review Error:", err);
    res.status(500).send("Error initiating review process");
  }
};

// STEP 2 - Verify OTP & Save (UNCHANGED)
export const verifyReviewOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).send("Unauthorized");

    if (
      !user.reviewOtp ||
      user.reviewOtp !== String(otp) ||
      user.reviewOtpExpires < Date.now() ||
      !user.tempReviewData
    ) {
      return res.render("professor/verify-otp", {
        email: user.email,
        assignmentId: user.tempReviewData?.assignmentId,
        error: "Invalid or Expired OTP.",
      });
    }

    const { assignmentId, decision, remark, signature, signatureImage } =
      user.tempReviewData;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).send("Assignment not found");

    if (assignment.reviewerId.toString() !== user._id.toString()) {
      return res.status(403).send("Unauthorized review action");
    }

    assignment.history.push({
      action: decision,
      remark,
      signature: signature || null,
      signatureImage: signatureImage || null,
      reviewerId: user._id,
      date: new Date(),
    });

    if (decision === "approved") {
      assignment.status = "approved";
      assignment.approvalRemark = remark;
      assignment.reviewerSignature = signature || null;
      assignment.reviewerSignatureImage = signatureImage || null;
    } else {
      assignment.status = "rejected";
      assignment.rejectionRemark = remark;
      assignment.reviewerSignature = signature || null;
      assignment.reviewerSignatureImage = signatureImage || null;
    }

    await assignment.save();

    await Notification.create({
      userId: assignment.studentId,
      assignmentId: assignment._id,
      sender: user._id,
      message: `Your assignment "${assignment.title}" was ${decision} by ${user.name}.`,
      type: decision,
      read: false,
    });

    if (decision === "approved") {
      try {
        const student = await User.findById(assignment.studentId);
        await sendEmail({
          to: student.email,
          subject: `Assignment "${assignment.title}" Approved`,
          html: assignmentApprovedTemplate(
            student.name,
            assignment.title,
            remark,
            assignment._id
          ),
        });
      } catch (err) {
        console.error("Approval email failed:", err);
      }
    }

    if (decision === "rejected") {
      try {
        const student = await User.findById(assignment.studentId);
        await sendEmail({
          to: student.email,
          subject: `Assignment "${assignment.title}" Rejected`,
          html: assignmentRejectedTemplate(
            student.name,
            assignment.title,
            remark,
            assignment._id
          ),
        });
      } catch (err) {
        console.error("Rejection email failed:", err);
      }
    }

    user.reviewOtp = undefined;
    user.reviewOtpExpires = undefined;
    user.tempReviewData = undefined;
    await user.save();

    res.redirect("/professor/dashboard?status=submitted");
  } catch (err) {
    console.error("OTP Verify Error:", err);
    res.status(500).send("Error verifying review");
  }
};

// Forward Assignment - ONLY FOR APPROVED ASSIGNMENTS
export const forwardAssignment = async (req, res) => {
  try {
    const { newReviewerId, note } = req.body;
    const assignmentId = req.params.id;

    if (!newReviewerId || !note) {
      return res
        .status(400)
        .send("HOD selection and forwarding note are required");
    }

    if (note.trim().length < 10) {
      return res
        .status(400)
        .send("Forwarding note must be at least 10 characters");
    }

    const assignment = await Assignment.findById(assignmentId).populate(
      "studentId",
      "name email"
    );

    if (!assignment) {
      return res.status(404).send("Assignment not found");
    }

    // CRITICAL: Only approved assignments can be forwarded
    if (assignment.status !== "approved") {
      return res
        .status(400)
        .send("Only approved assignments can be forwarded to HOD");
    }

    // Verify new reviewer is HOD in same department
    const newReviewer = await User.findById(newReviewerId);

    if (!newReviewer) {
      return res.status(404).send("Selected reviewer not found");
    }

    if (newReviewer.role !== "hod") {
      return res.status(400).send("Assignment can only be forwarded to HOD");
    }

    if (newReviewer.department !== req.user.department) {
      return res.status(400).send("Can only forward to HOD in your department");
    }

    // Update assignment
    assignment.reviewerId = newReviewerId;
    assignment.status = "forwarded";

    // Add to history
    assignment.history.push({
      action: "forwarded",
      remark: note,
      reviewerId: req.user._id,
      date: new Date(),
    });

    await assignment.save();

    // Notify HOD
    await Notification.create({
      userId: newReviewerId,
      assignmentId: assignment._id,
      sender: req.user._id,
      type: "forwarded",
      message: `Assignment "${assignment.title}" has been forwarded to you by ${req.user.name} for final approval.`,
      read: false,
    });

    // Notify student
    await Notification.create({
      userId: assignment.studentId._id,
      assignmentId: assignment._id,
      sender: req.user._id,
      type: "forwarded",
      message: `Your assignment "${assignment.title}" has been forwarded to HOD for final review.`,
      read: false,
    });

    res.redirect(
      "/professor/dashboard?message=Assignment forwarded successfully"
    );
  } catch (err) {
    console.error("Forward Assignment Error:", err);
    res.status(500).send("Error forwarding assignment");
  }
};

// Notifications (UNCHANGED)
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate("assignmentId", "title status")
      .sort({ createdAt: -1 })
      .limit(20);

    res.render("professor/notifications", { notifications });
  } catch (err) {
    console.error("Notifications Error:", err);
    res.status(500).send("Error loading notifications");
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.redirect("/professor/notifications");
  } catch (err) {
    console.error("Mark Read Error:", err);
    res.status(500).send("Error marking notification as read");
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.redirect("/professor/notifications");
  } catch (err) {
    console.error("Mark All Read Error:", err);
    res.status(500).send("Error marking notifications as read");
  }
};
