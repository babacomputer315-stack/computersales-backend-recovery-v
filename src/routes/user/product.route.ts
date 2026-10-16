import { Router } from "express";
import * as ProductController from "../../controllers/user/product.controller";

const router = Router();

/**
 * @route GET /api/user/products
 * @desc Get all published products with filtering and pagination
 * @access Public
 */
router.get("/", ProductController.getAllProducts);

/**
 * @route GET /api/user/products/featured
 * @desc Get featured products
 * @access Public
 */
router.get("/featured", ProductController.getFeaturedProducts);

/**
 * @route GET /api/user/products/search
 * @desc Search products by name, description, or SKU
 * @access Public
 */
router.get("/search", ProductController.searchProducts);

/**
 * @route GET /api/user/products/filter/specification-options
 * @desc Filter products by specification options (single or multiple)
 * @access Public
 */
router.get("/filter/specification-options", ProductController.getProductsBySpecificationOptions);

/**
 * @route GET /api/user/products/:id
 * @desc Get product by ID
 * @access Public
 */
router.get("/:id", ProductController.getProductById);

/**
 * @route GET /api/user/products/slug/:slug
 * @desc Get product by slug
 * @access Public
 */
router.get("/slug/:slug", ProductController.getProductBySlug);

/**
 * @route GET /api/user/products/:productId/related
 * @desc Get related products based on category
 * @access Public
 */
router.get("/:productId/related", ProductController.getRelatedProducts);

export default router;
