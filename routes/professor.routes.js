import express from "express";
import { protect, professorOnly } from "../middlewares/auth.middleware.js";
import {
  getProfessorDashboard,
  getReviewPage,
  getAssignmentDetails,
  submitReview,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/professor.controller.js";

const router = express.Router();

// Dashboard
router.get("/dashboard", protect, professorOnly, getProfessorDashboard);

// Review (for editing/submitting reviews)
router.get("/review/:id", protect, professorOnly, getReviewPage);
router.post("/review/:id", protect, professorOnly, submitReview);

// Details (for viewing only - NEW ROUTE)
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
