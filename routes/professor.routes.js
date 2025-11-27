import express from "express";
import { protect, professorOnly } from "../middlewares/auth.middleware.js";
import { uploadSignature } from "../middlewares/multer.middleware.js"; // Import new uploader
import {
  getProfessorDashboard,
  getReviewPage,
  getAssignmentDetails,
  initiateReview,
  verifyReviewOTP,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/professor.controller.js";

const router = express.Router();

// Dashboard
router.get("/dashboard", protect, professorOnly, getProfessorDashboard);

// OTP Verification (Must be before :id routes)
router.post("/review/verify-otp", protect, professorOnly, verifyReviewOTP);

// Review (Step 1: Initiate & Send OTP)
// ADDED uploadSignature middleware here to handle the file upload
router.get("/review/:id", protect, professorOnly, getReviewPage);
router.post(
  "/review/:id",
  protect,
  professorOnly,
  uploadSignature,
  initiateReview
);

// Details (for viewing only)
router.get("/details/:id", protect, professorOnly, getAssignmentDetails);

// Notifications
router.get("/notifications", protect, professorOnly, getNotifications);
router.post(
  "/notifications/:id/mark-read",
  protect,
  professorOnly,
  markNotificationRead
);
router.post(
  "/notifications/mark-all-read",
  protect,
  professorOnly,
  markAllNotificationsRead
);

export default router;
