import { Router } from "express";
import { UserBannerController } from "../../controllers/user/banner.controller";

const router = Router();

// Get all banners
router.get("/", UserBannerController.getAll);

// Get active banners
router.get("/active", UserBannerController.getActiveBanners);

// Search banners
router.get("/search", UserBannerController.searchBanners);

// Get banner by ID
router.get("/:id", UserBannerController.getById);

export default router;
