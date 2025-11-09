import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * @param {Object} userModel - Mongoose model (Admin, Student, etc.)
 * @param {String} email - user email
 * @param {String} password - plain password
 * @returns {Object} { success, token, message }
 */



export const commonLogin = async (userModel, email, password) => {
  const user = await userModel.findOne({ email });
  if (!user) return { success: false, message: "Invalid credentials" };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { success: false, message: "Invalid credentials" };

  const token = jwt.sign(
    { id: user._id, role: userModel.modelName },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { success: true, token };
};
