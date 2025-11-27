import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "professor", "hod"], required: true },
  department: { type: String },
  reviewOtp: { type: String },
  reviewOtpExpires: { type: Date },

  // Temporary holding area for the review data while waiting for OTP
  tempReviewData: {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
    decision: String,
    remark: String,
    signature: String,       // Text signature
    signatureImage: String   // NEW: Path to uploaded signature image
  }
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("User", userSchema);
