import { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/asyncHandler";
import { successResponse, errorResponse } from "../../../utils/apiResponse";
import { getNumber } from "../../../utils/filterFormatter";
import { categoryToSpecificationService } from "../../../services/admin/product/categoryToSpecification.service";

export const getCategorySpecifications = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = getNumber(req.params.categoryId);
    if (!categoryId)
      return errorResponse(res, "شناسه دسته‌بندی نامعتبر است", 400);

    const specs = await categoryToSpecificationService.getByCategoryId(
      categoryId
    );
    return successResponse(res, specs);
  }
);

export const addSpecificationToCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = getNumber(req.params.categoryId);
    const specificationId = getNumber(req.body.specificationId);
    const isRequired = Boolean(req.body.isRequired);
    const order = getNumber(req.body.order);

    if (!categoryId || !specificationId) {
      return errorResponse(res, "شناسه دسته‌بندی یا مشخصه نامعتبر است", 400);
    }

    const result =
      await categoryToSpecificationService.addSpecificationToCategory(
        categoryId,
        specificationId,
        isRequired,
        order || undefined
      );

    return successResponse(res, result, "", 201);
  }
);

export const removeSpecificationFromCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = getNumber(req.params.categoryId);
    const specificationId = getNumber(req.params.specificationId);

    if (!categoryId || !specificationId) {
      return errorResponse(res, "شناسه دسته‌بندی یا مشخصه نامعتبر است", 400);
    }

    await categoryToSpecificationService.removeSpecificationFromCategory(
      categoryId,
      specificationId
    );

    return successResponse(res, null, "مشخصه از دسته‌بندی حذف شد", 200);
  }
);

export const updateSpecificationOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = getNumber(req.params.categoryId);
    const specificationId = getNumber(req.params.specificationId);
    const order = getNumber(req.body.order);

    if (!categoryId || !specificationId || order === undefined) {
      return errorResponse(res, "پارامترهای ورودی نامعتبر هستند", 400);
    }

    await categoryToSpecificationService.updateSpecificationOrder(
      categoryId,
      specificationId,
      order
    );

    return successResponse(res, null, "ترتیب مشخصه به‌روزرسانی شد", 200);
  }
);

export const updateCategorySpecification = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = getNumber(req.params.categoryId);
    const specificationId = getNumber(req.params.specificationId);
    const { isRequired, order } = req.body;

    if (!categoryId || !specificationId) {
      return errorResponse(res, "شناسه دسته‌بندی یا مشخصه نامعتبر است", 400);
    }

    const updateData: { isRequired?: boolean; order?: number } = {};

    if (isRequired !== undefined) {
      updateData.isRequired = Boolean(isRequired);
    }

    if (order !== undefined) {
      updateData.order = getNumber(order);
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(
        res,
        "هیچ فیلدی برای به‌روزرسانی ارسال نشده است",
        400
      );
    }

    const result =
      await categoryToSpecificationService.updateCategorySpecification(
        categoryId,
        specificationId,
        updateData
      );

    return successResponse(res, result, "مشخصه دسته‌بندی به‌روزرسانی شد", 200);
  }
);
