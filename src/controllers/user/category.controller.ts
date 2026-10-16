import { Request, Response } from "express";
import { UserCategoryService } from "../../services/user/category.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const data = await UserCategoryService.getAll();
    return successResponse(res, data, "Categories retrieved successfully");
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch categories", err);
  }
};

export const getCategoryTree = async (req: Request, res: Response) => {
  try {
    const data = await UserCategoryService.getTree();
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch category tree", err);
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = await UserCategoryService.getById(id);
    return successResponse(res, data, "Category retrieved successfully");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const data = await UserCategoryService.getBySlug(slug);
    return successResponse(res, data, "Category retrieved successfully");
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const getCategoriesWithProductCount = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await UserCategoryService.getWithProductCount();
    return successResponse(
      res,
      data,
      "Categories with product count retrieved successfully"
    );
  } catch (err: any) {
    console.error(err);
    return errorResponse(
      res,
      "Failed to fetch categories with product count",
      err
    );
  }
};

export const getPopularCategories = async (req: Request, res: Response) => {
  try {
    const { limit = "10" } = req.query;
    const data = await UserCategoryService.getPopularCategories(
      parseInt(limit as string, 10)
    );
    return successResponse(
      res,
      data,
      "Popular categories retrieved successfully"
    );
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch popular categories", err);
  }
};
