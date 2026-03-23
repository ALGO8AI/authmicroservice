import { Router } from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";
import uploadMiddleware from "../middlewares/upload.middleware.js";
import { uploadFile } from "../controllers/upload.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const UPLOAD_PATH = path.resolve(__dirname, "../../uploads");

// Ensure the uploads directory exists before multer tries to write to it.
fs.mkdirSync(UPLOAD_PATH, { recursive: true });

const upload = uploadMiddleware(UPLOAD_PATH);

router.use((req, res, next) => {
  req.uploadPath = UPLOAD_PATH;
  next();
});

router.post("/upload", upload.single("file"), uploadFile);

export default router;
