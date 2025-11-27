import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

import connectDB from "./config/db.config.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();
connectDB();

console.log("GEMINI KEY:", process.env.GEMINI_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Root route
app.get("/", (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect("/admin/dashboard");
    } catch {
      res.clearCookie("token");
    }
  }
  return res.redirect("/auth/login");
});

// Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/admin/departments", departmentRoutes);
app.use("/admin/users", userRoutes);

// Student
import studentRoutes from "./routes/studentAssignments.routes.js";
app.use("/student", studentRoutes);

// Professor
import professorRoutes from "./routes/professor.routes.js";
app.use("/professor", professorRoutes);

// Start server
app.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on port ${process.env.PORT}`)
);
