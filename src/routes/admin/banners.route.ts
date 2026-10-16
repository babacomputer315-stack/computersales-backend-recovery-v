import { Router } from "express";
import { BannerController } from "../../controllers/admin/banner.controller";

const router = Router();

// Get all banners
router.get("/", BannerController.getAll);

// Search banners
router.get("/search", BannerController.searchBanners);

// Get banner by ID
router.get("/:id", BannerController.getById);

// Create new banner
router.post("/", BannerController.create);

// Update banner
router.put("/:id", BannerController.update);

// Bulk delete banners
router.delete("/bulk", BannerController.bulkDelete);

// Delete banner
router.delete("/:id", BannerController.delete);

export default router;
