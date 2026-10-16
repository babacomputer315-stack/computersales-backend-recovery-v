import { Router } from "express";
import { BrandController } from "../../controllers/admin/brand.controller";

const router = Router();

// Get all brands
router.get("/", BrandController.getAll);

// Get featured brands
router.get("/featured", BrandController.getFeaturedBrands);

// Get active brands
router.get("/active", BrandController.getActiveBrands);

// Search brands
router.get("/search", BrandController.searchBrands);

// Get brand by ID
router.get("/:id", BrandController.getById);

// Get brand by slug
router.get("/slug/:slug", BrandController.getBySlug);

// Get brand with stats
router.get("/:id/stats", BrandController.getWithStats);

// Create new brand
router.post("/", BrandController.create);

// Update brand
router.put("/:id", BrandController.update);

// Bulk update status
router.put("/bulk/status", BrandController.bulkUpdateStatus);

// Bulk update featured
router.put("/bulk/featured", BrandController.bulkUpdateFeatured);

// Delete brand
router.delete("/:id", BrandController.delete);

export default router;

