import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    category: {
      type: String,
      enum: ["Assignment", "Thesis", "Report"],
      required: true,
    },
    fileUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    submittedAt: { type: Date, default: Date.now },
    history: [
      {
        action: { type: String }, // submitted / approved / rejected / resubmitted
        remark: { type: String },
        date: { type: Date, default: Date.now },
        reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        signature: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
