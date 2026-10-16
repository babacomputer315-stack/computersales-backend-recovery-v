import { Request, Response } from "express";
import { UserBlogService } from "../../services/user/blog.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

/**
 * Get all published blog posts with filters, search, and pagination
 */
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      sortBy,
      sortOrder,
      search,
      categoryId,
      categorySlug,
      tagId,
      tagSlug,
      tagIds,
      publishedAfter,
      publishedBefore,
    } = req.query;

    let tagIdsArray: number[] | undefined = undefined;
    if (tagIds) {
      if (Array.isArray(tagIds)) {
        tagIdsArray = tagIds.map((id) => parseInt(id as string, 10));
      } else {
        tagIdsArray = (tagIds as string)
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
      }
    }

    const { data, pagination } = await UserBlogService.getAll({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy:
        (sortBy as "title" | "publishedAt" | "createdAt") || "publishedAt",
      sortOrder: (sortOrder as "asc" | "desc") || "desc",
      filters: {
        search: search as string,
        categoryId: categoryId
          ? parseInt(categoryId as string, 10)
          : undefined,
        categorySlug: categorySlug as string,
        tagId: tagId ? parseInt(tagId as string, 10) : undefined,
        tagSlug: tagSlug as string,
        tagIds: tagIdsArray,
        publishedAfter: publishedAfter
          ? new Date(publishedAfter as string)
          : undefined,
        publishedBefore: publishedBefore
          ? new Date(publishedBefore as string)
          : undefined,
      },
    });

    return successResponse(res, data, "", 200, pagination);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch blog posts", err);
  }
};

/**
 * Get a blog post by ID
 */
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await UserBlogService.getById(parseInt(id, 10));
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, err.message || "Failed to fetch blog post", err);
  }
};

/**
 * Get a blog post by slug
 */
export const getPostBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const data = await UserBlogService.getBySlug(slug);
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, err.message || "Failed to fetch blog post", err);
  }
};

/**
 * Get recent blog posts
 */
export const getRecentPosts = async (req: Request, res: Response) => {
  try {
    const { limit = "5" } = req.query;
    const data = await UserBlogService.getRecent(parseInt(limit as string, 10));
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch recent blog posts", err);
  }
};

/**
 * Get related blog posts
 */
export const getRelatedPosts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = "5" } = req.query;
    const data = await UserBlogService.getRelated(
      parseInt(id, 10),
      parseInt(limit as string, 10)
    );
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch related blog posts", err);
  }
};

/**
 * Get all blog categories
 */
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const data = await UserBlogService.getAllCategories();
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch categories", err);
  }
};

/**
 * Get a blog category by slug
 */
export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const data = await UserBlogService.getCategoryBySlug(slug);
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, err.message || "Failed to fetch category", err);
  }
};

/**
 * Get all blog tags
 */
export const getAllTags = async (req: Request, res: Response) => {
  try {
    const data = await UserBlogService.getAllTags();
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch tags", err);
  }
};

/**
 * Get a blog tag by slug
 */
export const getTagBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const data = await UserBlogService.getTagBySlug(slug);
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, err.message || "Failed to fetch tag", err);
  }
};

/**
 * Search blog posts
 */
export const searchPosts = async (req: Request, res: Response) => {
  try {
    const { q, limit = "20" } = req.query;

    if (!q) {
      return errorResponse(res, "Search query is required", null, 400);
    }

    const data = await UserBlogService.search(
      q as string,
      parseInt(limit as string, 10)
    );
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to search blog posts", err);
  }
};

























