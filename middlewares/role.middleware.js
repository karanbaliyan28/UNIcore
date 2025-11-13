export const adminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== "Admin") {
    return res.status(403).send("Access denied");
  }
  next();
};
export const studentOnly = (req, res, next) => {
  if (req.user?.role !== "student")
    return res.status(403).send("Access Denied");
  next();
};

export const professorOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "professor") {
    return res.status(403).send("Access denied");
  }
  next();
};

export const hodOnly = (req, res, next) => {
  if (req.user?.role !== "hod") return res.status(403).send("Access Denied");
  next();
};
