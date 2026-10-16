import { Router } from "express";
import * as CategoryController from "../../controllers/user/category.controller";

const router = Router();

/**
 * @route GET /api/user/categories
 * @desc Get all categories
 * @access Public
 */
router.get("/", CategoryController.getAllCategories);

/**
 * @route GET /api/user/categories/tree
 * @desc Get all categories
 * @access Public
 */
router.get("/tree", CategoryController.getCategoryTree);

/**
 * @route GET /api/user/categories/with-count
 * @desc Get all categories with product count
 * @access Public
 */
router.get("/with-count", CategoryController.getCategoriesWithProductCount);

/**
 * @route GET /api/user/categories/popular
 * @desc Get popular categories based on product count
 * @access Public
 */
router.get("/popular", CategoryController.getPopularCategories);

/**
 * @route GET /api/user/categories/:id
 * @desc Get category by ID
 * @access Public
 */
router.get("/:id", CategoryController.getCategoryById);

/**
 * @route GET /api/user/categories/slug/:slug
 * @desc Get category by slug
 * @access Public
 */
router.get("/slug/:slug", CategoryController.getCategoryBySlug);

export default router;
