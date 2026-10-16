import { Request, Response } from "express";
import { createCrudController } from "../base.controller";
import {
  adminProductCommentService,
  setAnswer,
  setApproval,
  getUserCommentsService,
} from "../../../services/admin/product/productComment.service";
import {
  getNumber,
  getNumberOrUndefined,
  getString,
  isValidSortBy,
  isValidSortOrder,
} from "../../../utils/filterFormatter";
import { asyncHandler } from "../../../middlewares/asyncHandler";
import { successResponse, errorResponse } from "../../../utils/apiResponse";

export const { getAll, getById, create, update, remove } = createCrudController(
  adminProductCommentService as any,
  {
    messages: {
      notFound: "نظری با این شناسه یافت نشد",
      created: "نظر با موفقیت ثبت شد",
      updated: "نظر با موفقیت ویرایش شد",
      deleted: "نظر با موفقیت حذف شد",
    },
    buildFilters: (req) => {
      const {
        content,
        productId,
        authorId,
        isApproved,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query as any;
      return {
        content: getString(content),
        productId: getNumberOrUndefined(productId),
        authorId: getNumberOrUndefined(authorId),
        isApproved:
          typeof isApproved === "string" ? isApproved === "true" : undefined,
        sortBy: isValidSortBy(sortBy) ? sortBy : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? sortOrder : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
      };
    },
  }
);

export const getUserComments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getNumber(req.params.userId);
    if (!userId) return errorResponse(res, "Invalid User ID", 400);
    const comments = await getUserCommentsService(userId);
    return successResponse(res, comments);
  }
);

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const id = getNumber(req.params.id);
  if (!id) return errorResponse(res, "Invalid ID", 400);
  const updated = await setApproval(id, true);
  return successResponse(res, updated, "نظر تایید شد");
});

export const answer = asyncHandler(async (req: Request, res: Response) => {
  const id = getNumber(req.params.id);
  if (!id) return errorResponse(res, "Invalid ID", 400);
  const { answer } = req.body as { answer?: string };
  if (!answer) return errorResponse(res, "Answer is required", 400);
  const updated = await setAnswer(id, req.body.answer);
  return successResponse(res, updated, "پاسخ با موفقیت ثبت شد");
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const id = getNumber(req.params.id);
  if (!id) return errorResponse(res, "Invalid ID", 400);
  const updated = await setApproval(id, false);
  return successResponse(res, updated, "نظر رد شد");
});
