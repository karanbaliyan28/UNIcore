import express from "express";
import { protect, hodOnly } from "../middlewares/auth.middleware.js";
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

router.get("/review/:id", protect, hodOnly, getHodReviewPage);

router.get("/dashboard", protect, hodOnly, getHodDashboard);
router.get("/assignments/:id", protect, hodOnly, getHodReviewPage);
router.post("/assignments/:id/approve", protect, hodOnly, hodApprove);
router.post("/assignments/:id/reject", protect, hodOnly, hodReject);

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
router.get("/details/:id", protect, hodOnly, getHodDetails);


export default router;
