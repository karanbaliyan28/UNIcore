import Department from "../models/department.model.js";
import User from "../models/user.model.js";

// Render Add Department Page
export const getAddDepartment = (req, res) => {
  res.render("add-department", {
    title: "Add Department",
    error: null,
    success: null,
  });
};

// Handle Department Creation
export const postAddDepartment = async (req, res) => {
  try {
    const { name, programType, address } = req.body;

    // Validate required fields 
    if (!name || !programType || !address) {
      return res.render("add-department", {
        title: "Add Department",
        error: "All fields are required!",
        success: null,
      });
    }

    // Check for duplicates
    const existing = await Department.findOne({ name });
    if (existing) {
      return res.render("add-department", {
        title: "Add Department",
        error: "Department with this name already exists!",
        success: null,
      });
    }

    const department = new Department({
      name,
      programType,
      address,
      createdBy: req.admin?._id,
    });

    await department.save();

    // Redirect with success message
    res.redirect("/admin/departments?success=Department created successfully!");
  } catch (err) {
    console.error("Error creating department:", err);
    res.render("add-department", {
      title: "Add Department",
      error: "Something went wrong. Please try again!",
      success: null,
    });
  }
};

// Show all departments with pagination, search, and filter
export const getAllDepartments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filterType = req.query.type || "";

    // Build query
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (filterType) {
      query.programType = filterType;
    }

    // Get total count for pagination
    const totalDepartments = await Department.countDocuments(query);
    const totalPages = Math.ceil(totalDepartments / limit);

    // Get departments with pagination
    const departments = await Department.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get user count for each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const userCount = await User.countDocuments({ department: dept.name });
        return { ...dept, userCount };
      })
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

// Render Edit Department Page
export const getEditDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.redirect("/admin/departments?error=Department not found");
    }

    res.render("edit-department", {
      title: "Edit Department",
      department,
      error: null,
    });
  } catch (err) {
    console.error("Error fetching department:", err);
    res.redirect("/admin/departments?error=Something went wrong");
  }
};

// Handle Department Update
export const postEditDepartment = async (req, res) => {
  try {
    const { name, programType, address } = req.body;
    const departmentId = req.params.id;

    // Validate required fields
    if (!name || !programType || !address) {
      const department = await Department.findById(departmentId);
      return res.render("edit-department", {
        title: "Edit Department",
        department,
        error: "All fields are required!",
      });
    }

    // Check for duplicate name (excluding current department)
    const existing = await Department.findOne({
      name,
      _id: { $ne: departmentId },
    });

    if (existing) {
      const department = await Department.findById(departmentId);
      return res.render("edit-department", {
        title: "Edit Department",
        department,
        error: "Department with this name already exists!",
      });
    }

    await Department.findByIdAndUpdate(departmentId, {
      name,
      programType,
      address,
    });

    res.redirect("/admin/departments?success=Department updated successfully!");
  } catch (err) {
    console.error("Error updating department:", err);
    const department = await Department.findById(req.params.id);
    res.render("edit-department", {
      title: "Edit Department",
      department,
      error: "Something went wrong. Please try again!",
    });
  }
};

// Handle Department Delete
export const deleteDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const department = await Department.findById(departmentId);

    if (!department) {
      return res.redirect("/admin/departments?error=Department not found");
    }

    // Check if department has users
    const userCount = await User.countDocuments({
      department: department.name,
    });

    if (userCount > 0) {
      return res.redirect(
        `/admin/departments?error=Cannot delete department with ${userCount} active users`
      );
    }

    await Department.findByIdAndDelete(departmentId);
    res.redirect("/admin/departments?success=Department deleted successfully!");
  } catch (err) {
    console.error("Error deleting department:", err);
    res.redirect("/admin/departments?error=Something went wrong");
  }
};
