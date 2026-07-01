import express from "express";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

import {
  getUsers,
  renderAddUserForm,
  addUser,
  renderEditUserForm,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

const router = express.Router();

// Show all users (with pagination, search, filters)
router.get("/", protect, adminOnly, getUsers);

// Show add user form
router.get("/add", protect, adminOnly, renderAddUserForm);

// Handle user creation
router.post("/add", protect, adminOnly, addUser);

// Show edit user form
router.get("/edit/:id", protect, adminOnly, renderEditUserForm);

// Handle user update
router.post("/edit/:id", protect, adminOnly, updateUser);

// Handle user deletion
router.post("/delete/:id", protect, adminOnly, deleteUser);

export default router;
