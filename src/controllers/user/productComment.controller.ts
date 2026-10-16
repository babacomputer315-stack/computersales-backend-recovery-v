import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { successResponse, errorResponse } from "../../utils/apiResponse";
import { getNumber, getNumberOrUndefined } from "../../utils/filterFormatter";
import {
  listApprovedByProduct,
  createComment,
} from "../../services/user/productComment.service";

export const getProductComments = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = getNumber(req.params.productId);
    if (!productId) return errorResponse(res, "Invalid Product ID", 400);

    const page = getNumberOrUndefined(req.query.page) || 1;
    const limit = getNumberOrUndefined(req.query.limit) || 20;

    const { data, pagination } = await listApprovedByProduct(
      productId,
      page,
      limit
    );
    return successResponse(res, data, "", 200, pagination);
  }
);

export const addProductComment = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = getNumber(req.params.productId);
    if (!productId) return errorResponse(res, "Invalid Product ID", 400);

    const { content, rating } = req.body as {
      content?: string;
      rating?: number;
    };
    if (!content || !content.trim())
      return errorResponse(res, "Content is required", 400);

    const user = (req as any).user as { id: number } | undefined;
    const authorId = user?.id ?? null;

    const inserted = await createComment(
      productId,
      authorId,
      content.trim(),
      rating ?? 0
    );
    if (!inserted) return errorResponse(res, "Product not found", 404);
    if (!rating) return errorResponse(res, "Rating is required", 400);
    // if (rating < 1 || rating > 5)
    //   return errorResponse(res, "Rating must be between 1 and 5", 400);
    return successResponse(
      res,
      inserted,
      "نظر ثبت شد و پس از تایید نمایش داده می‌شود",
      201
    );
  }
);
