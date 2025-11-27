import Assignment from "../models/assignment.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "../utils/email.js";
import { hodFinalApprovedTemplate } from "../emails/hodAprove.js";
import { hodFinalRejectedTemplate } from "../emails/hodReject.js";
export const getHodDashboard = async (req, res) => {
  try {
    const statusFilter = req.query.status || "all";
    const searchQuery = req.query.search || "";
    const sortBy = req.query.sort || "newest";

    let query = { reviewerId: req.user._id };

    if (statusFilter === "submitted") {
      query.status = { $in: ["submitted", "forwarded"] };
    } else if (statusFilter === "reviewed") {
      query.status = { $in: ["approved", "rejected"] };
    } else if (statusFilter === "rejected") {
      query.status = "rejected";
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    if (sortBy === "title") sortOptions = { title: 1 };

    let assignments = await Assignment.find(query)
      .populate("studentId", "name email")
      .populate("reviewerId", "name department");

    // Search
    if (searchQuery) {
      assignments = assignments.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.studentId.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === "newest")
      assignments.sort((a, b) => b.createdAt - a.createdAt);
    if (sortBy === "oldest")
      assignments.sort((a, b) => a.createdAt - b.createdAt);
    if (sortBy === "title")
      assignments.sort((a, b) => a.title.localeCompare(b.title));

    const pending = assignments.filter((a) =>
      ["submitted", "forwarded"].includes(a.status)
    ).length;

    const reviewed = assignments.filter((a) =>
      ["approved", "rejected"].includes(a.status)
    ).length;

    const rejected = assignments.filter((a) => a.status === "rejected").length;

    const total = pending + reviewed;

    const unreadNotifications = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    res.render("hod/dashboard", {
      assignments,
      pending,
      reviewed,
      rejected,
      total,
      statusFilter,
      searchQuery,
      sortBy,
      unreadNotifications,
      user: req.user,
    });
  } catch (err) {
    console.error("HOD Dashboard Error:", err);
    res.status(500).send("Error loading dashboard");
  }
};

export const getHodReviewPage = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("studentId", "name email")
      .populate("reviewerId", "name department")
      .populate("history.reviewerId", "name department");

    if (!assignment) return res.status(404).send("Assignment not found");

    if (assignment.reviewerId._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .send("You are not authorized to review this assignment");
    }

    res.render("hod/review", { assignment, user: req.user });
  } catch (err) {
    console.error("HOD Review Error:", err);
    res.status(500).send("Error loading review page");
  }
};

export const hodApprove = async (req, res) => {
  try {
    const { remark } = req.body;
    const assignmentId = req.params.id;

    if (!remark || remark.trim().length < 10) {
      return res
        .status(400)
        .send("Approval remarks must be at least 10 characters");
    }

    const assignment =
      await Assignment.findById(assignmentId).populate("studentId");

    if (!assignment) return res.status(404).send("Assignment not found");

    if (assignment.reviewerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .send("You are not authorized to approve this assignment");
    }

    assignment.status = "approved";

    assignment.history.push({
      action: "final approved",
      remark,
      reviewerId: req.user._id,
      date: new Date(),
    });

    await assignment.save();

    // 🔥 Send web notification
    await Notification.create({
      userId: assignment.studentId._id,
      assignmentId,
      sender: req.user._id,
      type: "approved",
      message: `Your assignment "${assignment.title}" has been approved by the HOD.`,
      read: false,
    });

    // 🔥 Send EMAIL
    await sendEmail({
      to: assignment.studentId.email,
      subject: "Your Assignment Has Been Approved by HOD ✔",
      html: hodFinalApprovedTemplate(
        assignment.studentId.name,
        assignment.title,
        remark,
        assignment._id
      ),
    });

    res.redirect("/hod/dashboard?message=Assignment approved successfully");
  } catch (err) {
    console.error("HOD Approve Error:", err);
    res.status(500).send("Error approving assignment");
  }
};

export const hodReject = async (req, res) => {
  try {
    const { remark } = req.body;
    const assignmentId = req.params.id;

    if (!remark || remark.trim().length < 10) {
      return res
        .status(400)
        .send("Rejection reason must be at least 10 characters");
    }

    const assignment =
      await Assignment.findById(assignmentId).populate("studentId");

    if (!assignment) return res.status(404).send("Assignment not found");

    if (assignment.reviewerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .send("You are not authorized to reject this assignment");
    }

    assignment.status = "rejected";
    assignment.rejectionRemark = remark;

    assignment.history.push({
      action: "final rejected",
      remark,
      reviewerId: req.user._id,
      date: new Date(),
    });

    await assignment.save();

    // 🔥 Send web notification
    await Notification.create({
      userId: assignment.studentId._id,
      assignmentId,
      sender: req.user._id,
      type: "rejected",
      message: `Your assignment "${assignment.title}" was rejected by the HOD.`,
      read: false,
    });

    // 🔥 Send EMAIL
    await sendEmail({
      to: assignment.studentId.email,
      subject: "Your Assignment Was Rejected by HOD ❌",
      html: hodFinalRejectedTemplate(
        assignment.studentId.name,
        assignment.title,
        remark,
        assignment._id
      ),
    });

    res.redirect("/hod/dashboard?message=Assignment rejected");
  } catch (err) {
    console.error("HOD Reject Error:", err);
    res.status(500).send("Error rejecting assignment");
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate("assignmentId", "title status")
      .populate("sender", "name")
      .sort({ createdAt: -1 });

    res.render("hod/notifications", { notifications, user: req.user });
  } catch (err) {
    console.error("Notifications Error:", err);
    res.status(500).send("Error loading notifications");
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.redirect("/hod/notifications");
  } catch (err) {
    console.error("Mark Read Error:", err);
    res.status(500).send("Error marking as read");
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.redirect("/hod/notifications");
  } catch (err) {
    console.error("Mark All Read Error:", err);
    res.status(500).send("Error marking all as read");
  }
};
export const getHodDetails = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("studentId", "name email")
      .populate("reviewerId", "name department")
      .populate("history.reviewerId", "name");

    if (!assignment) return res.status(404).send("Assignment not found");

    res.render("hod/details", { assignment });
  } catch (err) {
    console.error("HOD Details Error:", err);
    res.status(500).send("Error loading details page");
  }
};
