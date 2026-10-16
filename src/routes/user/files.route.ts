import express from "express";
import { uploadFile } from "../../controllers/user/file.controller";
import { upload } from "../../middlewares/multer";

const router = express.Router();

const uploadMiddleware = upload.any();

router.post("/upload", uploadMiddleware, uploadFile);

export default router;
