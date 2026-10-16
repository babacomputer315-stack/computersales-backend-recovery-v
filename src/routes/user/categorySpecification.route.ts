import { Router } from "express";
import { UserCategorySpecificationController } from "../../controllers/user/categorySpecification.controller";

const router = Router();

// Get category specifications by category ID
router.get("/category/:categoryId", UserCategorySpecificationController.getByCategoryId);

// Get category specifications by category slug
router.get("/category/slug/:categorySlug", UserCategorySpecificationController.getByCategorySlug);

// Get category specifications by category ID or slug (flexible endpoint)
router.get("/:identifier", UserCategorySpecificationController.getByCategoryIdOrSlug);

export default router;

