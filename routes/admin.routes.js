import express from "express";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";
import {
  getDashboard,
  getAddDepartment,
  postAddDepartment,
  getAllDepartments,
  getEditDepartment,
  postEditDepartment,
  deleteDepartment,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/dashboard", protect, adminOnly, getDashboard);

// Show all departments (with pagination, search, filter)
router.get("/", protect, adminOnly, getAllDepartments);

// Show add department form
router.get("/add", protect, adminOnly, getAddDepartment);

// Handle department creation
router.post("/add", protect, adminOnly, postAddDepartment);

// Show edit department form
router.get("/edit/:id", protect, adminOnly, getEditDepartment);

// Handle department update
router.post("/edit/:id", protect, adminOnly, postEditDepartment);

// Handle department deletion
router.post("/delete/:id", protect, adminOnly, deleteDepartment);

export default router;
