import { Admin } from "../models/admin.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  const { email, password } = req.body;

  // --- 1. Try Admin First ---
  const admin = await Admin.findOne({ email });
  if (admin) {
    const match = await bcrypt.compare(password, admin.password);
    if (!match)
      return res.render("login", { error: "Invalid email or password" });

    const token = jwt.sign(
      {
        id: admin._id,
        role: "admin",
        department: admin.department ?? null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, { httpOnly: true });
    return res.redirect("/admin/dashboard");
  }

  // --- 2. Try User (Student / Professor / HOD) ---
  const user = await User.findOne({ email });
  if (!user) return res.render("login", { error: "Invalid email or password" });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.render("login", { error: "Invalid email or password" });

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      department: user.department,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.cookie("token", token, { httpOnly: true });

  // REDIRECT BASED ON ROLE
  if (user.role === "student") return res.redirect("/student/dashboard");
  if (user.role === "professor") return res.redirect("/professor/dashboard");
  if (user.role === "hod") return res.redirect("/hod/dashboard");

  // fallback
  res.redirect("/auth/login");
};

export const logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/auth/login");
};
