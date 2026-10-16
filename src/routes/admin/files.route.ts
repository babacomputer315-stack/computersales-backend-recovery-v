import express from "express";
import {
  uploadFile,
  getFile,
  deleteFile,
  listFiles,
} from "../../controllers/admin/file.controller";
import { upload } from "../../middlewares/multer";

const router = express.Router();

const uploadMiddleware = upload.any();

router.post("/upload", uploadMiddleware, uploadFile);
router.get("/:filename", getFile);
router.delete("/:filename", deleteFile);
router.get("/", listFiles);

export default router;