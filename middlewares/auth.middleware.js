import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.redirect("/auth/login");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // stores { id, email, role }
    res.locals.user = req.user;
    next();
  } catch (err) {
    console.error("JWT error:", err);
    return res.redirect("/auth/login");
  }
};
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin")
    return res.status(403).send("Access denied");
  next();
};

export const studentOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "student")
    return res.status(403).send("Access denied");
  next();
};

export const professorOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "professor")
    return res.status(403).send("Access denied");
  next();
};

export const hodOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "hod")
    return res.status(403).send("Access denied");
  next();
};
