import { Request, Response } from "express";
import { ProductService } from "../../../services/admin/product/product.service";
import { successResponse, errorResponse } from "../../../utils/apiResponse";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "20",
      sortBy,
      sortOrder,
      name,
      isPublished,
      categoryId,
      categoryIds,
      tagId,
      isFeatured,
      brandId,
    } = req.query;

    let categoryIdsArray: number[] | undefined = undefined;
    if (categoryIds) {
      if (Array.isArray(categoryIds)) {
        categoryIdsArray = categoryIds.map((id) => parseInt(id as string, 10));
      } else {
        categoryIdsArray = (categoryIds as string)
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
      }
    }

    const { data, pagination } = await ProductService.getAll({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy: sortBy as any,
      sortOrder: (sortOrder as "asc" | "desc") || "desc",
      filters: {
        name: name as string,
        isPublished: isPublished ? isPublished === "true" : undefined,
        categoryId: categoryId ? parseInt(categoryId as string, 10) : undefined,
        categoryIds: categoryIdsArray,
        tagId: tagId ? parseInt(tagId as string, 10) : undefined,
        isFeatured: isFeatured ? isFeatured === "true" : undefined,
        brandId: brandId ? parseInt(brandId as string, 10) : undefined,
      },
    });

    return successResponse(res, data, "", 200, pagination);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch products", err);
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = await ProductService.getById(id);
    return successResponse(res, data);
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = await ProductService.create(req.body);
    return successResponse(res, data, "Product created successfully", 201);
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = await ProductService.update(id, req.body);
    return successResponse(res, data, "Product updated successfully");
  } catch (err: any) {
    console.log(err);
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = await ProductService.delete(id);
    return successResponse(res, data, "Product deleted successfully");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const duplicateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = await ProductService.duplicate(id);
    return successResponse(res, data, "", 201);
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};
