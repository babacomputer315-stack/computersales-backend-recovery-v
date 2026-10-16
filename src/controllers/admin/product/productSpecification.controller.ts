import { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/asyncHandler";
import { successResponse, errorResponse } from "../../../utils/apiResponse";
import { getNumber } from "../../../utils/filterFormatter";
import { productSpecificationService } from "../../../services/admin/product/productSpecification.service";

export const getProductSpecifications = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = getNumber(req.params.productId);
    if (!productId) return errorResponse(res, "شناسه محصول نامعتبر است", 400);

    const specs = await productSpecificationService.getByProductId(productId);
    return successResponse(res, specs);
  }
);

export const setProductSpecifications = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = getNumber(req.params.productId);
    const specifications = req.body;

    if (!productId || !Array.isArray(specifications)) {
      return errorResponse(res, "ورودی‌ها نامعتبر هستند", 400);
    }

    try {
      await productSpecificationService.setProductSpecifications(
        productId,
        specifications
      );
      return successResponse(res, null);
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message || "خطا در ذخیره مشخصات محصول";
        const isBadRequest =
          message.includes("Specification IDs not found") ||
          message.includes("Option IDs invalid for their specifications") ||
          message.includes("Product not found");
        return errorResponse(
          res,
          message,
          undefined,
          isBadRequest ? 400 : 500
        );
      }
      return errorResponse(res, "خطا در ذخیره مشخصات محصول", 500);
    }
  }
);
