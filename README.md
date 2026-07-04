# 🏫 UniCore — University Assignment & Workflow Approval System

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.x-brightgreen.svg?style=flat-square)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/express-v5.1.0-blue.svg?style=flat-square)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/database-MongoDB-green.svg?style=flat-square)](https://www.mongodb.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg?style=flat-square)](https://opensource.org/licenses/ISC)

**UniCore** is an elegant, secure, and modular university workflow automation backend and dashboard designed to streamline assignment submission, multi-level review, and department management. Built on a clean Model-View-Controller (MVC) architecture, UniCore integrates role-based security, document processing, and modern email notification systems.

---

## 🌟 Key Features

*   **👥 Role-Based Access Control (RBAC):** Secure panels with custom controls for **Admin**, **HOD (Head of Department)**, **Professors**, and **Students**.
*   **📂 Multi-Level Assignment Workflow:** Seamless submission by students, reviews by professors, and ultimate approval/rejection by HODs.
*   **📄 Rich Document Processing:** Parsing and drawing onto PDFs using `pdf-lib` and `pdf-parse`.
*   **📬 Automated Email Notifications:** Integrated communication via Brevo (Sendinblue), Resend, and Nodemailer for instant task notifications.
*   **🔒 High-Grade Security:** Session and JWT-based authentication using HTTP-only cookies, password hashing via `bcrypt`, and secure route guards.


---

## 🛠 Tech Stack

### Backend
*   **Runtime:** Node.js (ES Modules)
*   **Framework:** Express.js
*   **Database ORM:** Mongoose / MongoDB Atlas
*   **Session/Auth:** JSON Web Tokens (JWT), Cookies, Bcrypt

### View Template Engine
*   **Engine:** EJS (Embedded JavaScript) with `express-ejs-layouts`
*   **Styles:** Vanilla CSS with custom responsive layout designs

### Services & Libraries
*   **Email Deliverability:** Brevo API, Resend, Nodemailer
*   **PDF Tools:** `pdf-lib`, `pdf-parse`, `pdfjs-dist`

---

## 📂 Architecture Overview

```
UniCore-main/
├── config/             # Database connection & project constants
├── controllers/        # Business logic for Auth, Admin, HODs, Professors, and Students
├── emails/             # Email templates and delivery configs
├── middlewares/        # Authentication & Role-verification guards
├── models/             # Mongoose schemas (User, Admin, Assignment, Department, Notification)
├── public/             # Static assets (custom CSS files, client-side JS)
├── routes/             # Express routing endpoints divided by entity
├── scripts/            # Database seed scripts (e.g., creating superadmin)
├── uploads/            # Temporary/Persistent storage for uploaded PDFs and assignments
├── views/              # EJS template pages & layouts
├── server.js           # Server initialization & entrypoint config
└── .env                # Local environment configuration file (ignored by Git)
```

---

## 🚀 Getting Started & Installation Guide

Follow these steps to clone, configure, and run the UniCore project locally:

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/UNIcore.git
cd UNIcore
```

### 2️⃣ Install Dependencies

Make sure you have Node.js installed on your machine.
```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory:
```bash
touch .env
```

Add the following environment variables (updating them with your details):
```env
PORT=5000
NODE_ENV="development"

# Database
MONGO_URI="your_mongodb_connection_string"

# Authentication
JWT_SECRET="your_custom_jwt_secret_key"

# Email Configuration (Brevo / Resend / SMTP)
BREVO_API_KEY="your_brevo_api_key"
RESEND_API_KEY="your_resend_api_key"
```

### 4️⃣ Seed the Super Admin Account

Execute the seed script to create a default administrator user:
```bash
node scripts/createAdmin.scripts.js
```
*Default admin credentials created:*
*   **Email:** `admin@uni.com`
*   **Password:** `admin123`

### 5️⃣ Run the Application

*   **For Development (with Nodemon):**
    ```bash
    npm run dev
    ```
*   **For Production:**
    ```bash
    npm start
    ```

Once started, open your browser and navigate to **`http://localhost:5000`**.

---

## 🔐 User Roles & Permissions

| Role | Permissions & Capabilities |
| :--- | :--- |
| **👑 Super Admin** | Create and manage Departments, assign HODs, manage system users, view audits. |
| **🎓 HOD** | Final sign-off on department assignments, oversee professors & student performance. |
| **👨‍🏫 Professor** | Evaluate student submissions, provide marks/remarks, forward assignments. |
| **👦 Student** | Submit assignments, upload supporting document PDFs, view approvals/grades. |

---

## 📝 License
This project is licensed under the **ISC License**. Feel free to use and distribute it.
