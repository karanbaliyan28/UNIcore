import Assignment from "../models/assignment.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

// GET /professor/dashboard
export const getProfessorDashboard = async (req, res) => {
  try {
    // Get filter and search parameters
    // FIXED: Default to 'all' instead of 'submitted' to show everything initially
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

    // Count statistics (these should always show all assignments, not filtered)
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
    let sortOptions = { createdAt: 1 }; // oldest first by default
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

    // DEBUG: Log to check what's being loaded
    console.log("=== DASHBOARD DEBUG ===");
    console.log("Status Filter:", statusFilter);
    console.log("Query:", JSON.stringify(query));
    console.log("Assignments Found:", assignments.length);
    console.log(
      "Assignment Statuses:",
      assignments.map((a) => ({ title: a.title, status: a.status }))
    );
    console.log("======================");

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

    console.log("File URL:", assignment.fileUrl);

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

    console.log("File URL:", assignment.fileUrl);

    res.render("professor/details", { assignment });
  } catch (err) {
    console.error("Details Page Error:", err);
    res.status(500).send("Error loading assignment details");
  }
};

// POST /professor/review/:id
export const submitReview = async (req, res) => {
  try {
    const { remark, signature, decision } = req.body;

    const assignment = await Assignment.findById(req.params.id).populate(
      "studentId",
      "name"
    );

    if (!assignment) return res.status(404).send("Assignment not found");

    // Validate inputs
    if (!remark || !signature || !decision) {
      return res.status(400).send("All fields are required");
    }

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).send("Invalid decision");
    }

    // ADD TO HISTORY
    assignment.history.push({
      action: decision,
      remark,
      signature,
      reviewerId: req.user.id,
      date: new Date(),
    });

    if (decision === "approved") {
      assignment.status = "approved";
      assignment.approvalRemark = remark;
      assignment.reviewerSignature = signature;
    } else if (decision === "rejected") {
      assignment.status = "rejected";
      assignment.rejectionRemark = remark;
      assignment.reviewerSignature = signature;
    }

    await assignment.save();

    // SEND NOTIFICATION TO STUDENT
    await Notification.create({
      userId: assignment.studentId._id,
      assignmentId: assignment._id,
      sender: req.user._id,
      message: `Your assignment "${assignment.title}" was ${decision} by ${req.user.fullName}.`,
      type: decision,
      read: false,
    });

    res.redirect("/professor/dashboard?status=submitted");
  } catch (err) {
    console.error("Submit Review Error:", err);
    res.status(500).send("Could not submit review");
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
