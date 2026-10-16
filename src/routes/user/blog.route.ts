import { Router } from "express";
import * as BlogController from "../../controllers/user/blog.controller";

const router = Router();

/**
 * @route GET /api/user/blog/posts
 * @desc Get all published blog posts with filtering, search, and pagination
 * @access Public
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 * @query sortBy - Sort field: title, publishedAt, createdAt (default: publishedAt)
 * @query sortOrder - Sort order: asc, desc (default: desc)
 * @query search - Search in title, excerpt, content
 * @query categoryId - Filter by category ID
 * @query categorySlug - Filter by category slug
 * @query tagId - Filter by tag ID
 * @query tagSlug - Filter by tag slug
 * @query tagIds - Filter by multiple tag IDs (comma-separated)
 * @query publishedAfter - Filter posts published after this date
 * @query publishedBefore - Filter posts published before this date
 */
router.get("/posts", BlogController.getAllPosts);

/**
 * @route GET /api/user/blog/posts/recent
 * @desc Get recent blog posts
 * @access Public
 * @query limit - Number of posts to return (default: 5)
 */
router.get("/posts/recent", BlogController.getRecentPosts);

/**
 * @route GET /api/user/blog/posts/search
 * @desc Search blog posts
 * @access Public
 * @query q - Search query (required)
 * @query limit - Number of posts to return (default: 20)
 */
router.get("/posts/search", BlogController.searchPosts);

/**
 * @route GET /api/user/blog/posts/:id
 * @desc Get a blog post by ID
 * @access Public
 */
router.get("/posts/:id(\\d+)", BlogController.getPostById);

/**
 * @route GET /api/user/blog/posts/slug/:slug
 * @desc Get a blog post by slug
 * @access Public
 */
router.get("/posts/slug/:slug", BlogController.getPostBySlug);

/**
 * @route GET /api/user/blog/posts/:id/related
 * @desc Get related blog posts
 * @access Public
 * @query limit - Number of posts to return (default: 5)
 */
router.get("/posts/:id(\\d+)/related", BlogController.getRelatedPosts);

/**
 * @route GET /api/user/blog/categories
 * @desc Get all blog categories
 * @access Public
 */
router.get("/categories", BlogController.getAllCategories);

/**
 * @route GET /api/user/blog/categories/:slug
 * @desc Get a blog category by slug
 * @access Public
 */
router.get("/categories/:slug", BlogController.getCategoryBySlug);

/**
 * @route GET /api/user/blog/tags
 * @desc Get all blog tags
 * @access Public
 */
router.get("/tags", BlogController.getAllTags);

/**
 * @route GET /api/user/blog/tags/:slug
 * @desc Get a blog tag by slug
 * @access Public
 */
router.get("/tags/:slug", BlogController.getTagBySlug);

export default router;

























