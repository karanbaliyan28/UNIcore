import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { studentOnly } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/dashboard", protect, studentOnly, (req, res) => {
  res.render("student-dashboard", {
    title: "Student Dashboard",
    user: req.user,
  });
});

export default router;
