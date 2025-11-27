import mongoose from "mongoose";
import Assignment from "../models/assignment.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { getModel } from "../services/gemini.service.js";

// AI Check Assignment (uses memory buffer)
export const aiCheckAssignment = async (req, res) => {
  try {
    if (!req.file) {
      return res.send("Please upload a file.");
    }

    console.log("FILE RECEIVED:", req.file);

    const base64Data = req.file.buffer.toString("base64");
    const model = getModel("gemini-2.0-flash-exp");

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: req.file.mimetype,
        },
      },
      {
        text: `Extract all text from this file. Fix grammar, improve clarity, rewrite paragraphs.`,
      },
    ]);

    const response = await result.response;
    const aiText = response.text();

    return res.render("student/ai-check-result", {
      result: aiText,
      filename: req.file.originalname,
    });
  } catch (err) {
    console.error("AI CHECK ERROR:", err);
    return res.status(500).send("AI overloaded, try again in 5s.");
  }
};

// Get Dashboard with Filters and Pagination
export const getDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    const statusFilter = req.query.status || "all";
    const searchQuery = req.query.search || "";
    const sortBy = req.query.sort || "newest";

    let query = { studentId };

    if (statusFilter !== "all") {
      query.status = statusFilter;
    }

    if (searchQuery) {
      query.title = { $regex: searchQuery, $options: "i" };
    }

    const counts = await Assignment.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusCounts = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
    };
    counts.forEach((c) => {
      statusCounts[c._id] = c.count;
    });

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    let sortOptions = { createdAt: -1 };
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    if (sortBy === "title") sortOptions = { title: 1 };

    const assignments = await Assignment.find(query)
      .populate("reviewerId", "name department")
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const totalAssignments = await Assignment.countDocuments(query);
    const totalPages = Math.ceil(totalAssignments / limit);

    const unreadNotifications = await Notification.countDocuments({
      userId: studentId,
      read: false,
    });

    res.render("student/dashboard", {
      counts: statusCounts,
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

// Single Upload Page
export const getUploadForm = async (req, res) => {
  console.log("REQ.USER:", req.user);

  const professors = await User.find({
    role: "professor",
    department: req.user.department,
  });

  console.log("FOUND PROFESSORS:", professors);
  res.render("student/upload-single", { professors });
};

// Single Upload Handler
export const uploadAssignment = async (req, res) => {
  try {
    const { title, description, category, reviewerId } = req.body;

    if (!req.file) {
      return res.status(400).send("File is required");
    }

    console.log("UPLOADED FILE:", req.file);

    await Assignment.create({
      title,
      description,
      category,
      reviewerId,
      studentId: req.user.id,
      fileUrl: req.file.filename,
      status: "draft",
    });

    res.redirect("/student/dashboard");
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).send("Error uploading assignment");
  }
};

// Bulk Upload Page
export const getBulkUploadForm = async (req, res) => {
  const professors = await User.find({
    role: "professor",
    department: req.user.department,
  });

  res.render("student/bulk-upload", { professors });
};

// Bulk Upload Handler
export const bulkUploadAssignments = async (req, res) => {
  try {
    const { description, category, reviewerId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded");
    }

    const docs = req.files.map((file) => ({
      title: file.originalname,
      description,
      category,
      reviewerId,
      studentId: req.user.id,
      fileUrl: file.filename,
      sender: req.user._id,
      status: "draft",
    }));

    await Assignment.insertMany(docs);

    res.redirect("/student/dashboard");
  } catch (err) {
    console.error("Bulk Upload Error:", err);
    res.status(500).send("Error uploading assignments");
  }
};

// View All Assignments with Filters
export const getMyAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;

    const statusFilter = req.query.status || "all";
    const searchQuery = req.query.search || "";
    const sortBy = req.query.sort || "newest";

    let query = { studentId };

    if (statusFilter !== "all") {
      query.status = statusFilter;
    }

    if (searchQuery) {
      query.title = { $regex: searchQuery, $options: "i" };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    let sortOptions = { createdAt: -1 };
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    if (sortBy === "title") sortOptions = { title: 1 };

    const assignments = await Assignment.find(query)
      .populate("reviewerId", "name department")
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const totalAssignments = await Assignment.countDocuments(query);
    const totalPages = Math.ceil(totalAssignments / limit);

    res.render("student/my-assignments", {
      assignments,
      page,
      totalPages,
      statusFilter,
      searchQuery,
      sortBy,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading assignments");
  }
};

// View Single Assignment Details
export const getAssignmentDetails = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("reviewerId")
      .populate("history.reviewerId");

    if (!assignment || assignment.studentId.toString() !== req.user.id) {
      return res.status(404).send("Assignment not found.");
    }

    const professors = await User.find({
      role: "professor",
      department: req.user.department,
    }).select("name email department");

    return res.render("student/details", {
      assignment,
      professors,
      user: req.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Submit Assignment for Review
export const submitAssignment = async (req, res) => {
  try {
    const { reviewerId } = req.body;

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.studentId.toString() !== req.user.id) {
      return res.status(404).send("Assignment not found.");
    }

    if (assignment.status !== "draft") {
      return res.status(400).send("Assignment already submitted or processed.");
    }

    assignment.status = "submitted";
    assignment.reviewerId = reviewerId;

    // Add submission to history
    assignment.history.push({
      action: "submitted",
      remark: "Assignment submitted for review",
      date: new Date(),
    });

    await assignment.save();

    const user = await User.findById(req.user.id);

    await Notification.create({
      userId: reviewerId,
      message: `New assignment submitted: "${assignment.title}" by ${user.name}`,
      assignmentId: assignment._id,
      type: "submission",
      read: false,
    });

    return res.redirect(`/student/assignments/${assignment._id}`);
  } catch (err) {
    console.error("Submit Error:", err);
    res.status(500).send("Error submitting assignment.");
  }
};

// Download Assignment File
export const downloadAssignmentFile = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).send("File not found");
    }

    if (assignment.studentId.toString() !== req.user.id) {
      return res.status(403).send("Unauthorized");
    }

    res.download(assignment.fileUrl, (err) => {
      if (err) {
        console.error("Download Error:", err);
        res.status(404).send("File not found on server");
      }
    });
  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).send("Error downloading file");
  }
};

// Resubmit Rejected Assignment - FIXED
export const resubmitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.studentId.toString() !== req.user.id) {
      return res.status(404).send("Assignment not found.");
    }

    // Check if assignment can be resubmitted
    if (assignment.status !== "rejected") {
      return res
        .status(400)
        .send("Only rejected assignments can be resubmitted.");
    }

    // Handle file upload if provided
    if (req.file) {
      assignment.fileUrl = req.file.filename;
    }

    // Get reviewer from form
    const { reviewerId, remarks } = req.body;
    if (!reviewerId) {
      return res.status(400).send("Please select a reviewer.");
    }

    // Update assignment
    assignment.reviewerId = reviewerId;
    assignment.status = "submitted"; // Change to submitted for review
    assignment.rejectionRemark = null; // Clear previous rejection remark

    // Add resubmission to history
    assignment.history.push({
      action: "resubmitted",
      remark: remarks || "Assignment resubmitted after revision",
      date: new Date(),
    });

    await assignment.save();

    // Notify the new reviewer
    const user = await User.findById(req.user.id);
    await Notification.create({
      userId: reviewerId,
      message: `Assignment "${assignment.title}" has been resubmitted by ${user.name}`,
      assignmentId: assignment._id,
      type: "resubmission",
      read: false,
    });

    return res.redirect(`/student/assignments/${assignment._id}`);
  } catch (err) {
    console.error("Resubmit Error:", err);
    res.status(500).send("Error resubmitting assignment.");
  }
};

// Get Notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate("assignmentId", "title status")
      .sort({ createdAt: -1 })
      .limit(20);

    res.render("student/notifications", { notifications });
  } catch (err) {
    console.error("Notifications Error:", err);
    res.status(500).send("Error loading notifications");
  }
};

// Mark Notification as Read
export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.redirect("/student/notifications");
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
    res.redirect("/student/notifications");
  } catch (err) {
    console.error("Mark All Read Error:", err);
    res.status(500).send("Error marking notifications as read");
  }
};
