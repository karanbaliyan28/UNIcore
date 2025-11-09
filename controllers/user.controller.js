import User from "../models/user.model.js";
import Department from "../models/department.model.js";

export const getUsers = async (req, res) => {
  const users = await User.find();
  res.render("users", { users });
};

export const renderAddUserForm = async (req, res) => {
  const departments = await Department.find();
  res.render("add-user", { departments });
};

export const addUser = async (req, res) => {
  const { name, email, password, role, department } = req.body;
  try {
    const user = new User({ name, email, password, role, department });
    await user.save();
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding user");
  }
};
