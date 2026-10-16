import { blogCommentService } from "../../../services/admin/blog/blogComment.service";
import { createCrudController } from "../base.controller";
import {
  getString,
  getNumberOrUndefined,
  isValidSortBy,
  isValidSortOrder,
} from "../../../utils/filterFormatter";

export const { getAll, getById, create, update, remove } = createCrudController(
  blogCommentService,
  {
    messages: {
      notFound: "نظری با این شناسه یافت نشد",
      created: "نظر با موفقیت ثبت شد",
      updated: "نظر با موفقیت ویرایش شد",
      deleted: "نظر با موفقیت حذف شد",
    },
    buildFilters: (req) => {
      const { content, postId, authorId, sortBy, sortOrder, page, limit } =
        req.query;
      return {
        content: getString(content),
        postId: getNumberOrUndefined(postId),
        authorId: getNumberOrUndefined(authorId),
        sortBy: isValidSortBy(sortBy) ? sortBy : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? sortOrder : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
      };
    },
  }
);
