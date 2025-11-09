import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
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
// setup ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/admin/departments", departmentRoutes);
app.use("/admin/users", userRoutes);

app.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on port ${process.env.PORT}`)
);
