import { Router } from "express";
import { optionalAuth, authenticateToken } from "../../middlewares/auth";
import {
  addProductComment,
  getProductComments,
} from "../../controllers/user/productComment.controller";

const router = Router();

// List approved comments for a product
router.get("/:productId/comments", optionalAuth, getProductComments);

// Add comment to a product (requires auth)
router.post("/:productId/comments", authenticateToken, addProductComment);

export default router;
