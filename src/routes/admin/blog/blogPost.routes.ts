import express from "express";
import { BlogPostController } from "../../../controllers/admin/blog/blogPost.controller";

const router = express.Router();

router.get("/", BlogPostController.getAll);
router.get("/:id", BlogPostController.getById);
router.post("/", BlogPostController.create);
router.put("/:id", BlogPostController.update);
router.delete("/:id", BlogPostController.remove);

export default router;
