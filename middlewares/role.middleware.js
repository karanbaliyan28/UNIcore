export const adminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== "Admin") {
    return res.status(403).send("Access denied");
  }
  next();
};
