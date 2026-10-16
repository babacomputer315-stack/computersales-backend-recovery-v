import { Router } from "express";
import * as TagController from "../../controllers/user/tag.controller";

const router = Router();

/**
 * @route GET /api/user/tags
 * @desc Get all tags
 * @access Public
 */
router.get("/", TagController.getAllTags);

/**
 * @route GET /api/user/tags/with-count
 * @desc Get all tags with product count
 * @access Public
 */
router.get("/with-count", TagController.getTagsWithProductCount);

/**
 * @route GET /api/user/tags/popular
 * @desc Get popular tags based on product count
 * @access Public
 */
router.get("/popular", TagController.getPopularTags);

/**
 * @route GET /api/user/tags/:id
 * @desc Get tag by ID
 * @access Public
 */
router.get("/:id", TagController.getTagById);

/**
 * @route GET /api/user/tags/slug/:slug
 * @desc Get tag by slug
 * @access Public
 */
router.get("/slug/:slug", TagController.getTagBySlug);

export default router;
