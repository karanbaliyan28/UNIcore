import dotenv from "dotenv";
dotenv.config();

console.log("PORT =", process.env.PORT);
console.log("RESEND =", process.env.RESEND_API_KEY);
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

import connectDB from "./config/db.config.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import departmentRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";

connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // This parses form data
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

//auth Routes
app.use("/auth", authRoutes);
// Admin Routes
app.use("/admin", adminRoutes);
app.use("/admin/departments", departmentRoutes);
app.use("/admin/users", userRoutes);

// Student Routes
import studentRoutes from "./routes/student.routes.js";
app.use("/student", studentRoutes);

// Professor Routes
import professorRoutes from "./routes/professor.routes.js";
app.use("/professor", professorRoutes);

// HOD Routes
import hodRoutes from "./routes/hod.routes.js";
app.use("/hod", hodRoutes);

// Start server
app.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on port ${process.env.PORT}`)
);
