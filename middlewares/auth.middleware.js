// middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.redirect("/auth/login");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // IMPORTANT 👉 store decoded user here
    req.user = decoded; // { id, role }

    next();
  } catch (err) {
    console.error("JWT error:", err);
    return res.redirect("/auth/login");
  }
};
