import { commonLogin } from "../utils/authHelper.util.js";
import { Admin } from "../models/admin.model.js";

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  const result = await commonLogin(Admin, email, password);

  if (!result.success) return res.render("login", { error: result.message });

  res.cookie("token", result.token, { httpOnly: true });
  res.redirect("/admin/dashboard");
};

export const logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/auth/login");
};
