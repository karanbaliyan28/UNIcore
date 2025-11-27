import express from "express";
import { protect, studentOnly } from "../middlewares/auth.middleware.js";
import {
  uploadSingle,
  uploadMultiple,
  uploadForAI,
} from "../middlewares/multer.middleware.js";
import {
  getDashboard,
  getUploadForm,
  uploadAssignment,
  getBulkUploadForm,
  bulkUploadAssignments,
  getMyAssignments,
  getAssignmentDetails,
  submitAssignment,
  downloadAssignmentFile,
  resubmitAssignment,
  aiCheckAssignment,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/student.controller.js";

const router = express.Router();

// Dashboard
router.get("/dashboard", protect, studentOnly, getDashboard);

// Upload
router.get("/assignments/upload", protect, studentOnly, getUploadForm);
router.post(
  "/assignments/upload",
  protect,
  studentOnly,
  uploadSingle,
  uploadAssignment
);

// Bulk Upload
router.get("/bulk-upload", protect, studentOnly, getBulkUploadForm);
router.post(
  "/assignments/bulk-upload",
  protect,
  studentOnly,
  uploadMultiple,
  bulkUploadAssignments
);

// Assignments
router.get("/assignments", protect, studentOnly, getMyAssignments);
router.get("/assignments/:id", protect, studentOnly, getAssignmentDetails);
router.post("/assignments/:id/submit", protect, studentOnly, submitAssignment);
router.get(
  "/assignments/:id/download",
  protect,
  studentOnly,
  downloadAssignmentFile
);
router.post(
  "/assignments/:id/resubmit",
  protect,
  studentOnly,
  uploadSingle,
  resubmitAssignment
);

// AI Check - FIXED: Use uploadForAI instead of uploadSingle
router.post("/ai-check", protect, studentOnly, uploadForAI, aiCheckAssignment);

// Notifications
router.get("/notifications", protect, studentOnly, getNotifications);
router.post(
  "/notifications/:id/mark-read",
  protect,
  studentOnly,
  markNotificationRead
);
router.post(
  "/notifications/mark-all-read",
  protect,
  studentOnly,
  markAllNotificationsRead
);

export default router;
