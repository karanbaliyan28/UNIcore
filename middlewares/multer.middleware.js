import multer from "multer";
import path from "path";

// Disk storage for regular uploads (single & bulk)
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp + original name
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  },
});

// Memory storage for AI check (since you need buffer for Gemini)
const memoryStorage = multer.memoryStorage();

// File filter for PDFs only
function fileFilter(req, file, cb) {
  if (!file.mimetype.includes("pdf")) {
    return cb(new Error("Only PDF files allowed"));
  }
  cb(null, true);
}

// For regular single file uploads (saves to disk)
export const uploadSingle = multer({
  storage: diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
}).single("file");

// For AI check (uses memory buffer)
export const uploadForAI = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
}).single("file");

// For bulk uploads (saves to disk)
export const uploadMultiple = multer({
  storage: diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter,
}).array("files", 5); // Max 5 files
