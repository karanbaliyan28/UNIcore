import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { professorOnly } from "../middlewares/role.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

router.get("/dashboard", protect, professorOnly, async (req, res) => {
  const prof = await User.findById(req.user.id).lean();
  res.render("professor-dashboard", {
    title: "Professor Dashboard",
    user: prof,
  });
});

export default router;
