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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Serve static files (JS, CSS, Images)
app.use("/public", express.static(path.join(__dirname, "public")));

// setup ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Root route — check login
app.get("/", (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect("/admin/dashboard");
    } catch (error) {
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

//student routes
import studentRoutes from "./routes/student.routes.js";
app.use("/student", studentRoutes);

//professor routes
import professorRoutes from "./routes/professor.routes.js";

app.use("/professor", professorRoutes);

// Start server
app.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on port ${process.env.PORT}`)
);
