import { Request, Response } from "express";
import { UserTagService } from "../../services/user/tag.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export const getAllTags = async (req: Request, res: Response) => {
  try {
    const data = await UserTagService.getAll();
    return successResponse(res, data, "Tags retrieved successfully");
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch tags", err);
  }
};

export const getTagById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = await UserTagService.getById(id);
    return successResponse(res, data, "Tag retrieved successfully");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const getTagBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const data = await UserTagService.getBySlug(slug);
    return successResponse(res, data, "Tag retrieved successfully");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const getTagsWithProductCount = async (req: Request, res: Response) => {
  try {
    const data = await UserTagService.getWithProductCount();
    return successResponse(res, data, "Tags with product count retrieved successfully");
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch tags with product count", err);
  }
};

export const getPopularTags = async (req: Request, res: Response) => {
  try {
    const { limit = "10" } = req.query;
    const data = await UserTagService.getPopularTags(parseInt(limit as string, 10));
    return successResponse(res, data, "Popular tags retrieved successfully");
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch popular tags", err);
  }
};
