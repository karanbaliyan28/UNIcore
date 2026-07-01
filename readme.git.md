### 🧠 Git Commands to Push Your Backend Project to a New Repository

Here’s the **step-by-step Git workflow** to push your backend project (the one above) to a **new GitHub repo** safely and cleanly.

---

#### 1️⃣ Initialize Git in your project folder

```bash
cd ~/Desktop/ClgBackend/Third_year_FinalProject

# Initialize git repo
git init
```

#### 2️⃣ Create a `.gitignore`

Add the most common ignores for Node.js projects:

```bash
echo "node_modules/\n.env\n.env.local\n.DS_Store\n" > .gitignore
```

---

#### 3️⃣ Stage & commit everything

```bash
git add .
git commit -m "Initial commit - complete backend setup with MVC and JWT auth"
```

---

#### 4️⃣ Create a new GitHub repository

1. Go to [https://github.com/new](https://github.com/new)
2. Give it a name (e.g., `university-assignment-platform-backend`)
3. **Do NOT** initialize with README, .gitignore, or license (since you already have them)

You’ll see instructions like:

```bash
git remote add origin https://github.com/<your-username>/university-assignment-platform-backend.git
git branch -M main
git push -u origin main
```

Copy-paste and run those lines.

---

#### 5️⃣ Verify push

```bash
git status
git log --oneline
git remote -v
```

You should see your remote repo and commits.

---

#### 6️⃣ Optional: add README for clarity

```bash
echo "# University Assignment Platform (Backend)
Node.js + Express + MongoDB + JWT Auth (Admin Panel)
" > README.md

git add README.md
git commit -m "Add project README"
git push
```

---

### ✅ Summary — Your Repo Now Includes

```
Third_year_FinalProject/
├── server.js
├── .env (ignored by git)
├── config/db.js
├── models/
├── controllers/
├── routes/
├── middlewares/
├── utils/
├── scripts/createAdmin.js
├── public/js/departments.js
├── views/
└── .gitignore
```

---

### ⚡ Pro Tips for Exams & Projects

* Always keep `.env` and credentials out of GitHub.
* Commit in small, meaningful chunks: setup → auth → dashboard → departments.
* Use `git branch feature/users` when adding new features.
* Use `git log --oneline` to track your project timeline.

---

That’s it — your complete backend project is now version-controlled and safely stored on GitHub. 🚀
