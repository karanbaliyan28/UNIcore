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

    // Convert buffer to base64
    const base64Data = req.file.buffer.toString("base64");

    // Get the Gemini model
    const model = getModel("gemini-2.0-flash-exp");

    // Generate content with file and prompt
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

    // Get filter parameters
    const statusFilter = req.query.status || "all";
    const searchQuery = req.query.search || "";
    const sortBy = req.query.sort || "newest";

    // Build query
    let query = { studentId };

    // Apply status filter
    if (statusFilter !== "all") {
      query.status = statusFilter;
    }

    // Apply search filter
    if (searchQuery) {
      query.title = { $regex: searchQuery, $options: "i" };
    }

    // Count statistics
    const counts = await Assignment.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Convert counts to object for easy access
    const statusCounts = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
    };
    counts.forEach((c) => {
      statusCounts[c._id] = c.count;
    });

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Sorting
    let sortOptions = { createdAt: -1 }; // newest first by default
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    if (sortBy === "title") sortOptions = { title: 1 };

    // Get assignments with pagination
    const assignments = await Assignment.find(query)
      .populate("reviewerId", "name department")
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const totalAssignments = await Assignment.countDocuments(query);
    const totalPages = Math.ceil(totalAssignments / limit);

    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      userId: studentId,
      read: false,
    });

    res.render("student-dashboard", {
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
  res.render("upload-assignment", { professors });
};

// Single Upload Handler
export const uploadAssignment = async (req, res) => {
  try {
    const { title, description, category, reviewerId } = req.body;

    if (!req.file) {
      return res.status(400).send("File is required");
    }

    console.log("UPLOADED FILE:", req.file);

    // Create assignment with proper file path
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

  res.render("bulk-upload", { professors });
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
      fileUrl: file.filename, // FIXED
      sender: req.user._id, // OPTIONAL but recommended
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

    // Get filter parameters
    const statusFilter = req.query.status || "all";
    const searchQuery = req.query.search || "";
    const sortBy = req.query.sort || "newest";

    // Build query
    let query = { studentId };

    // Apply status filter
    if (statusFilter !== "all") {
      query.status = statusFilter;
    }

    // Apply search filter
    if (searchQuery) {
      query.title = { $regex: searchQuery, $options: "i" };
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    // Sorting
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

    res.render("my-assignments", {
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
      .populate("reviewerId", "name department")
      .populate("history.reviewerId", "name department");

    if (!assignment || assignment.studentId.toString() !== req.user.id) {
      return res.status(404).send("Assignment not found");
    }

    const professors = await User.find({
      role: "professor",
      department: req.user.department,
    });

    console.log("Assignment fileUrl:", assignment.fileUrl);

    res.render("assignment-details", { assignment, professors });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading assignment details");
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
    await assignment.save();

    // Correct Notification
    await Notification.create({
      userId: reviewerId,
      sender: req.user._id, // <-- MUST ADD
      message: `New assignment submitted: "${assignment.title}" by ${req.user.fullName}`,
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

// Resubmit Rejected Assignment
export const resubmitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.studentId.toString() !== req.user.id) {
      return res.status(404).send("Assignment not found");
    }

    if (assignment.status !== "rejected") {
      return res
        .status(403)
        .send("Only rejected assignments can be resubmitted.");
    }

    // Save old rejection into history
    assignment.history.push({
      action: "rejected",
      remark: assignment.rejectionRemark || "Rejected previously",
      reviewerId: assignment.reviewerId,
      date: new Date(),
      signature: assignment.reviewerSignature || null,
    });

    // Add resubmission history entry
    assignment.history.push({
      action: "resubmitted",
      remark: "Student uploaded a new file",
      reviewerId: assignment.reviewerId,
      date: new Date(),
    });

    // Replace file if new one uploaded
    if (req.file) {
      assignment.fileUrl = req.file.filename;
    }

    // Allow updating description
    if (req.body.description) {
      assignment.description = req.body.description;
    }

    // Reset status to submitted
    assignment.status = "submitted";

    await assignment.save();

    // Notify reviewer
    await Notification.create({
      userId: assignment.reviewerId,
      message: `Assignment resubmitted: "${assignment.title}" by ${req.user.name}`,
      assignmentId: assignment._id,
      type: "resubmission",
      read: false,
    });

    return res.redirect(`/student/assignments/${assignment._id}`);
  } catch (err) {
    console.error("Resubmit Error:", err);
    return res.status(500).send("Error during resubmission.");
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
