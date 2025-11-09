// controllers/dashboardController.js
import Department from "../models/department.model.js";
import User from "../models/user.model.js";

export const getDashboard = async (req, res) => {
  try {
    const departmentCount = await Department.countDocuments();
    const userCount = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: "student" });
    const professorCount = await User.countDocuments({ role: "professor" });
    const hodCount = await User.countDocuments({ role: "hod" });
    res.render("admin-dashboard", {
      admin: req.admin,
      departmentCount,
      userCount,
      studentCount,
      professorCount,
      hodCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
