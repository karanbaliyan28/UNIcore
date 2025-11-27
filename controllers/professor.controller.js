import Assignment from "../models/assignment.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import crypto from "crypto";
import { sendEmail } from "../utils/email.js"; // Ensure you have this utility created

// GET /professor/dashboard
export const getProfessorDashboard = async (req, res) => {
  try {
    // Get filter and search parameters
    const statusFilter = req.query.status || "all";
    const searchQuery = req.query.search || "";
    const sortBy = req.query.sort || "oldest";

    // Build query
    let query = { reviewerId: req.user.id, status: { $ne: "draft" } };

    // Apply status filter - only add status to query if not 'all'
    if (statusFilter !== "all") {
      query.status = statusFilter; // submitted, approved, rejected
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

    // Count statistics
    const pending = await Assignment.countDocuments({
      reviewerId: req.user.id,
      status: "submitted",
    });

    const approved = await Assignment.countDocuments({
      reviewerId: req.user.id,
      status: "approved",
    });

    const rejected = await Assignment.countDocuments({
      reviewerId: req.user.id,
      status: "rejected",
    });

    const totalReviewed = approved + rejected;

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

    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
    });

    res.render("professor/dashboard", {
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

// GET /professor/review/:id - For reviewing/editing
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

// GET /professor/details/:id - For viewing only (no editing)
export const getAssignmentDetails = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("studentId", "name email")
      .populate("reviewerId", "name")
      .populate("history.reviewerId", "name department");

    if (!assignment) return res.status(404).send("Assignment not found");

    res.render("professor/details", { assignment });
  } catch (err) {
    console.error("Details Page Error:", err);
    res.status(500).send("Error loading assignment details");
  }
};

// ==========================================
// NEW: STEP 1 - Initiate Review (Send OTP)
// ==========================================
// professor.controller.js - Update initiateReview function

export const initiateReview = async (req, res) => {
  try {
    const { remark, signature, decision } = req.body;
    const assignmentId = req.params.id;

    // Check if image file was uploaded
    const signatureImage = req.file ? req.file.filename : null;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).send("Assignment not found");

    // Validate: Must have either text signature OR image signature
    if (!signature && !signatureImage) {
      return res.status(400).send("Signature is required (text or image)");
    }

    if (!remark || !decision) {
      return res.status(400).send("Remark and decision are required");
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const user = await User.findById(req.user.id);

    // Save temporary data INCLUDING signature type
    user.reviewOtp = otp;
    user.reviewOtpExpires = Date.now() + 10 * 60 * 1000;
    user.tempReviewData = {
      assignmentId: assignment._id,
      decision: decision,
      remark: remark,
      signature: signature || null, // Text signature (if provided)
      signatureImage: signatureImage || null, // Image signature (if provided)
    };

    await user.save();

    // Send email with signature preview
    const signaturePreview = signatureImage
      ? "<p><em>(Signature Image Uploaded)</em></p>"
      : `<p style="font-family: 'Great Vibes', cursive; font-size: 24px; color: #4f46e5;">${signature}</p>`;

    await sendEmail({
      to: user.email,
      subject: "UNICore: Verify Assignment Review",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Assignment Review Verification</h2>
          <p>You are about to <strong style="color: ${decision === "approved" ? "#10b981" : "#ef4444"};">${decision.toUpperCase()}</strong> the assignment:</p>
          <p style="font-style: italic; font-size: 18px;">"${assignment.title}"</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Digital Signature:</p>
            ${signaturePreview}
          </div>
          
          <div style="background: #eef2ff; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #6366f1; font-weight: bold;">Your OTP Code:</p>
            <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 10px 0;">${otp}</h1>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">Valid for 10 minutes</p>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">If you did not initiate this review, please ignore this email.</p>
        </div>
      `,
    });

    res.render("professor/verify-otp", {
      email: user.email,
      assignmentId: assignmentId,
    });
  } catch (err) {
    console.error("Initiate Review Error:", err);
    res.status(500).send("Error initiating review process");
  }
};

// ==========================================
// NEW: STEP 2 - Verify OTP & Save (Commit Image to History)
// ==========================================
export const verifyReviewOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);

    if (
      !user.reviewOtp ||
      user.reviewOtp !== otp ||
      user.reviewOtpExpires < Date.now()
    ) {
      return res.render("professor/verify-otp", {
        email: user.email,
        assignmentId: user.tempReviewData?.assignmentId,
        error: "Invalid or Expired OTP.",
      });
    }

    // Retrieve ALL temp data including image
    const { assignmentId, decision, remark, signature, signatureImage } =
      user.tempReviewData;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).send("Assignment not found");

    // Update History with Image
    assignment.history.push({
      action: decision,
      remark: remark,
      signature: signature,
      signatureImage: signatureImage, // <--- Save image to history
      reviewerId: user._id,
      date: new Date(),
    });

    if (decision === "approved") {
      assignment.status = "approved";
      assignment.approvalRemark = remark;
      assignment.reviewerSignature = signature;
      assignment.reviewerSignatureImage = signatureImage;
    } else if (decision === "rejected") {
      assignment.status = "rejected";
      assignment.rejectionRemark = remark;
      assignment.reviewerSignature = signature;
      assignment.reviewerSignatureImage = signatureImage;
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

    // Cleanup
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
// Get Notifications
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

// Mark Notification as Read
export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.redirect("/professor/notifications");
  } catch (err) {
    console.error("Mark Read Error:", err);
    res.status(500).send("Error marking notification as read");
  }
};

// Mark All Notifications as Read
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
