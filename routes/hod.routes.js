import express from "express";
import { protect, hodOnly } from "../middlewares/auth.middleware.js";
import { uploadSignature } from "../middlewares/multer.middleware.js"; // Import signature uploader
import {
  getHodDashboard,
  getHodReviewPage,
  hodApprove,
  hodReject,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getHodDetails,
} from "../controllers/hod.controller.js";

const router = express.Router();

// Dashboard
router.get("/dashboard", protect, hodOnly, getHodDashboard);

// Review Pages
router.get("/review/:id", protect, hodOnly, getHodReviewPage);
router.get("/assignments/:id", protect, hodOnly, getHodReviewPage);

// Details
router.get("/details/:id", protect, hodOnly, getHodDetails);

// Approve & Reject - WITH MULTER FOR FILE UPLOAD
router.post(
  "/assignments/:id/approve",
  protect,
  hodOnly,
  uploadSignature,
  hodApprove
);
router.post(
  "/assignments/:id/reject",
  protect,
  hodOnly,
  uploadSignature,
  hodReject
);

// Notifications
router.get("/notifications", protect, hodOnly, getNotifications);
router.post(
  "/notifications/:id/mark-read",
  protect,
  hodOnly,
  markNotificationRead
);
router.post(
  "/notifications/mark-all-read",
  protect,
  hodOnly,
  markAllNotificationsRead
);

export default router;
