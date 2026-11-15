import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../utils/Apierror";

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

    cb(null, uniqueName);
  },
});

const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb
) => {
  const allowedMimeTypes = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        "Only PDF, TXT, and DOCX files are allowed"
      )
    );
  }

  cb(null, true);
};

export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});