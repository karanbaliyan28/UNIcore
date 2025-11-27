import express from "express";
import { protect ,adminOnly} from "../middlewares/auth.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";
const router = express.Router();

router.get("/dashboard", protect, adminOnly, getDashboard);

export default router;
