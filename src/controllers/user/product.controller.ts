import { Request, Response } from "express";
import { UserProductService } from "../../services/user/product.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "20",
      sortBy,
      sortOrder,
      name,
      categoryId,
      categoryIds,
      tagId,
      minPrice,
      maxPrice,
      isFeatured,
      inStock,
      specificationOptionIds,
      withSpecifications,
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

    let specificationOptionIdsArray: number[] | undefined = undefined;
    if (specificationOptionIds) {
      if (Array.isArray(specificationOptionIds)) {
        specificationOptionIdsArray = specificationOptionIds.map((id) =>
          parseInt(id as string, 10)
        );
      } else {
        specificationOptionIdsArray = (specificationOptionIds as string)
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
      }
    }

    const { data, pagination, productsMinPrice, productsMaxPrice } =
      await UserProductService.getAll({
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        sortBy:
          (sortBy as
            | "name"
            | "createdAt"
            | "regularPrice"
            | "salePrice"
            | "stockQuantity"
            | "discount") || "createdAt",
        sortOrder: (sortOrder as "asc" | "desc") || "desc",
        filters: {
          name: name as string,
          categoryId: categoryId
            ? parseInt(categoryId as string, 10)
            : undefined,
          categoryIds: categoryIdsArray,
          tagId: tagId ? parseInt(tagId as string, 10) : undefined,
          minPrice: minPrice ? parseInt(minPrice as string, 10) : undefined,
          maxPrice: maxPrice ? parseInt(maxPrice as string, 10) : undefined,
          isFeatured: isFeatured ? isFeatured === "true" : undefined,
          inStock: inStock ? inStock === "true" : undefined,
          specificationOptionIds: specificationOptionIdsArray,
          withSpecifications: withSpecifications
            ? withSpecifications === "true"
            : undefined,
          brandId: brandId ? parseInt(brandId as string) : undefined,
        },
      });

    return successResponse(
      res,
      { data, productsMinPrice, productsMaxPrice },
      "",
      200,
      pagination
    );
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch products", err);
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = await UserProductService.getById(id);
    return successResponse(res, data, "");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const data = await UserProductService.getBySlug(slug);
    return successResponse(res, data, "");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const { limit = "10" } = req.query;
    const data = await UserProductService.getFeatured(
      parseInt(limit as string, 10)
    );
    return successResponse(res, data, "");
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch featured products", err);
  }
};

export const getRelatedProducts = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { limit = "8" } = req.query;
    const data = await UserProductService.getRelatedProducts(
      parseInt(productId, 10),
      parseInt(limit as string, 10)
    );
    return successResponse(res, data, "");
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch related products", err);
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q, limit = "20" } = req.query;

    if (!q || typeof q !== "string") {
      return errorResponse(res, "Search query is required", null, 400);
    }

    const data = await UserProductService.search(
      q,
      parseInt(limit as string, 10)
    );
    return successResponse(res, data);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to search products", err);
  }
};

export const getProductsBySpecificationOptions = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      specificationOptionIds,
      page = "1",
      limit = "20",
      sortBy,
      sortOrder,
      categoryId,
    } = req.query;

    if (!specificationOptionIds) {
      return errorResponse(
        res,
        "Specification option IDs are required",
        null,
        400
      );
    }

    let specificationOptionIdsArray: number[];
    if (Array.isArray(specificationOptionIds)) {
      specificationOptionIdsArray = specificationOptionIds.map((id) =>
        parseInt(id as string, 10)
      );
    } else {
      specificationOptionIdsArray = (specificationOptionIds as string)
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
    }

    if (specificationOptionIdsArray.length === 0) {
      return errorResponse(
        res,
        "At least one valid specification option ID is required",
        null,
        400
      );
    }

    const { data, pagination } =
      await UserProductService.getBySpecificationOptions(
        specificationOptionIdsArray,
        {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          sortBy:
            (sortBy as
              | "name"
              | "createdAt"
              | "regularPrice"
              | "salePrice"
              | "stockQuantity"
              | "discount") || "createdAt",
          sortOrder: (sortOrder as "asc" | "desc") || "desc",
          categoryId: categoryId
            ? parseInt(categoryId as string, 10)
            : undefined,
        }
      );

    return successResponse(
      res,
      data,
      "Products filtered by specification options retrieved successfully",
      200,
      pagination
    );
  } catch (err: any) {
    console.error(err);
    return errorResponse(
      res,
      "Failed to fetch products by specification options",
      err
    );
  }
};
