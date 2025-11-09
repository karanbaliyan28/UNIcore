import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";
const router = express.Router();

router.get("/dashboard", protect, adminOnly, getDashboard);

export default router;
