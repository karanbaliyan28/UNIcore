# Backend Wrap‑Up — Auth, Roles, Dashboard & Departments

Your focus: **production‑style Node.js + Express + MongoDB (Mongoose)** with clean MVC, JWT auth, and role‑based access. This file is your revision sheet.

---

## 0) Project Skeleton (Production Style)

```
Third_year_FinalProject/
├── server.js
├── .env
├── config/
│   └── db.js
├── models/
│   ├── admin.model.js
│   ├── user.model.js
│   └── department.model.js
├── controllers/
│   ├── auth.controller.js
│   ├── dashboard.controller.js
│   └── department.controller.js
├── middlewares/
│   ├── auth.middleware.js    // JWT verify
│   └── role.middleware.js    // adminOnly
├── utils/
│   └── authHelper.js         // commonLogin()
├── routes/
│   ├── auth.routes.js
│   ├── admin.routes.js
│   └── department.routes.js
└── scripts/
    └── createAdmin.js
```

---

## 1) Environment & Server Bootstrap

**.env**

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/universityDB
JWT_SECRET=supersecretkey
```

**config/db.js**

```js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
    process.exit(1);
  }
};
export default connectDB;
```

**server.js** (core backend wiring only)

```js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import departmentRoutes from "./routes/department.routes.js";

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/admin/departments", departmentRoutes);

app.listen(process.env.PORT, () => console.log(`🚀 Server running on ${process.env.PORT}`));
```

---

## 2) Models — Schemas, Rules, and Why

### 2.1 Admin Model

* Purpose: single (or few) accounts controlling the system
* Security: **bcrypt** hashing in `pre('save')`
* Unique fields: `email`

```js
// models/admin.model.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
```

### 2.2 User Model (HOD/Professor/Student)

* Purpose: **generic** academic users with roles and (optionally) a department
* Pre‑save hashing identical to Admin
* `role` is restricted using `enum`

```js
// models/user.model.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "professor", "hod"], required: true },
  department: { type: String } // simple string link for now (easy counting by name)
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
```

> **Exam Tip (relations):** We used a **denormalized string** for `department` to keep counts cheap by name (`countDocuments({ department: dept.name })`). In a stricter design, you could store an `ObjectId` ref to a Department — then aggregate `$lookup` when needed.

### 2.3 Department Model — and Why each field

* `name`: required + unique → prevents duplicates
* `programType`: constrained to a known set → consistent filtering (UG/PG/Research)
* `address`: optional data shown in UI
* `createdBy`: `ObjectId` ref **to Admin** → **audit trail** (who created it)

```js
// models/department.model.js
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  programType: { type: String, enum: ["UG", "PG", "Research"], required: true },
  address: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
}, { timestamps: true });

const Department = mongoose.model("Department", departmentSchema);
export default Department;
```

> **Exam Tip (indexes):** `unique: true` on `name` creates a unique index. For heavy filtering, consider an index on `{ programType: 1 }`.

---

## 3) Authentication — JWT + Common Login Utility

### 3.1 Common Login Utility (works for any model)

```js
// utils/authHelper.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const commonLogin = async (userModel, email, password) => {
  const user = await userModel.findOne({ email });
  if (!user) return { success: false, message: "Invalid credentials" };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { success: false, message: "Invalid credentials" };

  const token = jwt.sign(
    { id: user._id, role: userModel.modelName }, // role = "Admin" if Admin model passed
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  return { success: true, token };
};
```

### 3.2 Auth Controller (Login + Logout)

```js
// controllers/auth.controller.js
import Admin from "../models/admin.model.js";
import { commonLogin } from "../utils/authHelper.js";

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const result = await commonLogin(Admin, email, password);
  if (!result.success) return res.render("login", { error: result.message });

  res.cookie("token", result.token, { httpOnly: true, maxAge: 60 * 60 * 1000 });
  res.redirect("/admin/dashboard");
};

export const logoutAdmin = (req, res) => {
  res.clearCookie("token");
  res.redirect("/auth/login");
};
```

### 3.3 Middleware (Protect + Role‑check)

```js
// middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.redirect("/auth/login");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // { id, role }
    next();
  } catch (e) {
    return res.redirect("/auth/login");
  }
};
```

```js
// middlewares/role.middleware.js
export const adminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== "Admin") return res.status(403).send("Access denied");
  next();
};
```

### 3.4 Routes (Auth + Admin)

```js
// routes/auth.routes.js
import express from "express";
import { loginAdmin, logoutAdmin } from "../controllers/auth.controller.js";
const router = express.Router();

router.get("/login", (req, res) => res.render("login", { error: null }));
router.post("/login", loginAdmin);
router.get("/logout", logoutAdmin);

export default router;
```

```js
// routes/admin.routes.js
import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";
const router = express.Router();

router.get("/dashboard", protect, adminOnly, getDashboard);
export default router;
```

---

## 4) Dashboard — System Overview (Counts)

**Controller**

```js
// controllers/dashboard.controller.js
import Department from "../models/department.model.js";
import User from "../models/user.model.js";

export const getDashboard = async (req, res) => {
  try {
    const departmentCount = await Department.countDocuments();
    const userCount = await User.countDocuments();
    res.render("admin-dashboard", {
      title: "Dashboard",
      departmentCount,
      userCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
```

> **Exam Tip (aggregation):** For more complex stats, use `$facet` to compute multiple counts in a single pipeline.

---

## 5) Departments — CRUD + Pagination + Search + Filter

### 5.1 Routes

```js
// routes/department.routes.js
import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";
import {
  getAllDepartments,
  getAddDepartment,
  postAddDepartment,
  getEditDepartment,
  postEditDepartment,
  deleteDepartment,
} from "../controllers/department.controller.js";

const router = express.Router();
router.get("/", protect, adminOnly, getAllDepartments);
router.get("/add", protect, adminOnly, getAddDepartment);
router.post("/add", protect, adminOnly, postAddDepartment);
router.get("/edit/:id", protect, adminOnly, getEditDepartment);
router.post("/edit/:id", protect, adminOnly, postEditDepartment);
router.post("/delete/:id", protect, adminOnly, deleteDepartment);
export default router;
```

### 5.2 Controller (Core Logic)

```js
// controllers/department.controller.js
import Department from "../models/department.model.js";
import User from "../models/user.model.js";

export const getAddDepartment = (req, res) => {
  res.render("add-department", { title: "Add Department", error: null, success: null });
};

export const postAddDepartment = async (req, res) => {
  try {
    const { name, programType, address } = req.body;
    if (!name || !programType || !address) {
      return res.render("add-department", { title: "Add Department", error: "All fields are required!", success: null });
    }
    const existing = await Department.findOne({ name });
    if (existing) return res.render("add-department", { title: "Add Department", error: "Department with this name already exists!", success: null });

    await Department.create({ name, programType, address, createdBy: req.admin?.id });
    res.redirect("/admin/departments?success=Department created successfully!");
  } catch (err) {
    console.error("Error creating department:", err);
    res.render("add-department", { title: "Add Department", error: "Something went wrong. Please try again!", success: null });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filterType = req.query.type || "";

    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (filterType) query.programType = filterType;

    const totalDepartments = await Department.countDocuments(query);
    const totalPages = Math.ceil(totalDepartments / limit);

    const departments = await Department.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const departmentsWithCount = await Promise.all(
      departments.map(async (d) => ({ ...d, userCount: await User.countDocuments({ department: d.name }) }))
    );

    res.render("departments", {
      title: "Departments",
      departments: departmentsWithCount,
      success: req.query.success || null,
      currentPage: page,
      totalPages,
      totalDepartments,
      search,
      filterType,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

export const getEditDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.redirect("/admin/departments?error=Department not found");
    res.render("edit-department", { title: "Edit Department", department, error: null });
  } catch (err) {
    console.error("Error fetching department:", err);
    res.redirect("/admin/departments?error=Something went wrong");
  }
};

export const postEditDepartment = async (req, res) => {
  try {
    const { name, programType, address } = req.body;
    const departmentId = req.params.id;

    if (!name || !programType || !address) {
      const department = await Department.findById(departmentId);
      return res.render("edit-department", { title: "Edit Department", department, error: "All fields are required!" });
    }

    const exists = await Department.findOne({ name, _id: { $ne: departmentId } });
    if (exists) {
      const department = await Department.findById(departmentId);
      return res.render("edit-department", { title: "Edit Department", department, error: "Department with this name already exists!" });
    }

    await Department.findByIdAndUpdate(departmentId, { name, programType, address });
    res.redirect("/admin/departments?success=Department updated successfully!");
  } catch (err) {
    console.error("Error updating department:", err);
    const department = await Department.findById(req.params.id);
    res.render("edit-department", { title: "Edit Department", department, error: "Something went wrong. Please try again!" });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const department = await Department.findById(departmentId);
    if (!department) return res.redirect("/admin/departments?error=Department not found");

    const userCount = await User.countDocuments({ department: department.name });
    if (userCount > 0) return res.redirect(`/admin/departments?error=Cannot delete department with ${userCount} active users`);

    await Department.findByIdAndDelete(departmentId);
    res.redirect("/admin/departments?success=Department deleted successfully!");
  } catch (err) {
    console.error("Error deleting department:", err);
    res.redirect("/admin/departments?error=Something went wrong");
  }
};
```

> **Optimization (exam bonus):** Replace the N queries for user counts with one aggregation:

```js
const counts = await User.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]);
const map = Object.fromEntries(counts.map(x => [x._id, x.count]));
const enriched = departments.map(d => ({ ...d, userCount: map[d.name] || 0 }));
```

---

## 6) Data Seeding — Create Admin Script

```js
// scripts/createAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/admin.model.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

await Admin.deleteMany({ email: "admin@uni.com" }); // optional cleanup
await Admin.create({ username: "superadmin", email: "admin@uni.com", password: "admin123" });

console.log("✅ Admin created successfully");
process.exit();
```

**Run**

```
node scripts/createAdmin.js
```

---

## 7) Concept Map — Flow of a Protected Admin Page

1. **Login POST /auth/login** → `commonLogin(Admin, ...)` → set `httpOnly` cookie `token`
2. **Visit /admin/dashboard** → `protect` verifies JWT → `adminOnly` checks role → `getDashboard` controller → render
3. **Logout GET /auth/logout** → clears cookie → redirect to login

> **JWT payload:** `{ id, role }` where role is auto‑set via `userModel.modelName` ("Admin").

---

## 8) Mongoose Schema Design — Exam Notes

* **Validation**: `required`, `enum`, `minlength`, `maxlength`, `match`
* **Indexes**: `unique` (creates unique index); for frequent queries add `.index()`
* **Hooks**: `pre('save')` for hashing; `pre('find')` for soft‑delete filters
* **Refs vs denorm**: Use `ref` for relational integrity & population; use denormalized fields for fast lookups
* **Lean reads**: Use `.lean()` when you only need plain JSON (faster, less memory)
* **Aggregation**: `$match` → `$group` → `$project` for stats; `$facet` for multiple metrics in one pipeline
* **Error Handling**: Wrap `try/catch`; send friendly messages; log server error details
* **Security**: Never store plaintext passwords; `httpOnly` cookies; short JWT expiry; validate inputs

Quick snippets:

```js
// index example
Department.schema.index({ programType: 1 });

// populate example (if using ObjectId reference on users)
User.find().populate("department", "name programType");
```

---

## 9) What to Revise Before Exam

* Write a schema from scratch with `required/unique/enum` and a `pre('save')` hash
* JWT login flow (sign, set cookie, verify in middleware)
* Role‑based route protection
* Pagination with `limit/skip` + `countDocuments`
* Search with regex, filter with query params
* Basic aggregation `$group` for counts
* Script to seed data safely

---

## 10) One‑Screen Cheats

**Protect middleware**

```js
export const protect = (req, res, next) => {
  const t = req.cookies?.token; if (!t) return res.redirect("/auth/login");
  try { req.admin = jwt.verify(t, process.env.JWT_SECRET); next(); }
  catch { return res.redirect("/auth/login"); }
};
```

**adminOnly**

```js
export const adminOnly = (req, res, next) => {
  if (req.admin?.role !== "Admin") return res.status(403).send("Access denied");
  next();
};
```

**Paginated find**

```js
const page = +req.query.page || 1, limit = 10, skip = (page-1)*limit;
const [items, total] = await Promise.all([
  Model.find(query).sort({createdAt:-1}).skip(skip).limit(limit).lean(),
  Model.countDocuments(query)
]);
```

**Safe regex search**

```js
const q = req.query.search; if (q) query.name = { $regex: q, $options: "i" };
```

---

**You’ve got this.** Rehearse the flow, then write one clean route + model + controller from memory. That’s the win.



