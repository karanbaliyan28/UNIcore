import User from "../models/user.model.js";
import Department from "../models/department.model.js";
import { sendEmail } from "../utils/email.js";
import { userCreatedTemplate } from "../emails/userCreatedTemplate.js";
import { userUpdatedTemplate } from "../emails/userUpdatedTemplate.js";
import { userDeletedTemplate } from "../emails/userDeleteTemplate.js";

// Get all users with pagination, search, and filters

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filterRole = req.query.role || "";
    const filterDepartment = req.query.department || "";

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (filterRole) {
      query.role = filterRole;
    }

    if (filterDepartment) {
      query.department = filterDepartment;
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    // Get users with pagination
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get all departments for filter dropdown
    const departments = await Department.find().select("name").lean();

    res.render("users", {
      title: "Users",
      users,
      departments,
      success: req.query.success || null,
      error: req.query.error || null,
      currentPage: page,
      totalPages,
      totalUsers,
      search,
      filterRole,
      filterDepartment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Render Add User Form
export const renderAddUserForm = async (req, res) => {
  try {
    const departments = await Department.find().select("name").lean();
    res.render("add-user", {
      title: "Add User",
      departments,
      error: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Add new user
export const addUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role || !department) {
      const departments = await Department.find().select("name").lean();
      return res.render("add-user", {
        title: "Add User",
        departments,
        error: "All fields are required!",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const departments = await Department.find().select("name").lean();
      return res.render("add-user", {
        title: "Add User",
        departments,
        error: "User with this email already exists!",
      });
    }

    // Create user in DB
    const user = new User({ name, email, password, role, department });
    await user.save();

    // Send email to the newly created user
    await sendEmail({
      to: email,
      subject: "Your University Portal Account is Ready",
      html: userCreatedTemplate(name, email, password, role, department),
    });

    res.redirect("/admin/users?success=User created successfully!");
  } catch (err) {
    console.error("Error adding user:", err);
    const departments = await Department.find().select("name").lean();
    res.render("add-user", {
      title: "Add User",
      departments,
      error: "Error adding user. Please try again!",
    });
  }
};

// Render Edit User Form
export const renderEditUserForm = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();

    if (!user) {
      return res.redirect("/admin/users?error=User not found");
    }

    const departments = await Department.find().select("name").lean();

    res.render("edit-user", {
      title: "Edit User",
      user,
      departments,
      error: null,
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.redirect("/admin/users?error=Something went wrong");
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { name, email, department, password } = req.body;
    const userId = req.params.id;

    // Validate required fields
    if (!name || !email || !department) {
      const user = await User.findById(userId).select("-password").lean();
      const departments = await Department.find().select("name").lean();
      return res.render("edit-user", {
        title: "Edit User",
        user,
        departments,
        error: "Name, email, role, and department are required!",
      });
    }

    // Check for duplicate email
    const existing = await User.findOne({ email, _id: { $ne: userId } });

    if (existing) {
      const user = await User.findById(userId).select("-password").lean();
      const departments = await Department.find().select("name").lean();
      return res.render("edit-user", {
        title: "Edit User",
        user,
        departments,
        error: "User with this email already exists!",
      });
    }

    // Fetch old data for email
    const oldUser = await User.findById(userId).lean();

    // Apply updates
    const updateData = { name, email, role, department };

    if (password && password.trim() !== "") {
      const user = await User.findById(userId);
      user.password = password;
      user.name = name;
      user.email = email;
      user.role = oldUser.role;
      user.department = department;
      await user.save();
    } else {
      await User.findByIdAndUpdate(userId, updateData);
    }

    // Send email about update
    await sendEmail({
      to: email,
      subject: "Your University Account Has Been Updated",
      html: userUpdatedTemplate(name, email, department),
    });

    res.redirect("/admin/users?success=User updated successfully!");
  } catch (err) {
    console.error("Error updating user:", err);
    const user = await User.findById(req.params.id).select("-password").lean();
    const departments = await Department.find().select("name").lean();
    res.render("edit-user", {
      title: "Edit User",
      user,
      departments,
      error: "Something went wrong. Please try again!",
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.redirect("/admin/users?error=User not found");
    }

    // Send deletion email BEFORE deleting
    await sendEmail({
      to: user.email,
      subject: "Your University Account Has Been Removed",
      html: userDeletedTemplate(user.name),
    });

    await User.findByIdAndDelete(userId);

    res.redirect("/admin/users?success=User deleted successfully!");
  } catch (err) {
    console.error("Error deleting user:", err);
    res.redirect("/admin/users?error=Something went wrong");
  }
};
