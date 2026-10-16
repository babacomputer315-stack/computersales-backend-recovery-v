import { Router } from "express";
import { UserBrandController } from "../../controllers/user/brand.controller";

const router = Router();

// Get all active brands
router.get("/", UserBrandController.getAll);

// Get featured brands
router.get("/featured", UserBrandController.getFeaturedBrands);

// Get active brands
router.get("/active", UserBrandController.getActiveBrands);

// Search brands
router.get("/search", UserBrandController.searchBrands);

// Get brands with product count
router.get("/with-products", UserBrandController.getBrandsWithProductCount);

// Get brand by ID
router.get("/:id", UserBrandController.getById);

// Get brand by slug
router.get("/slug/:slug", UserBrandController.getBySlug);

export default router;

