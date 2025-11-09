import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";
import {
  getUsers,
  renderAddUserForm,
  addUser,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protect, adminOnly, getUsers);
router.get("/add", protect, adminOnly, renderAddUserForm);
router.post("/add", protect, adminOnly, addUser);

export default router;
