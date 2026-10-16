import { blogTagService } from "../../../services/admin/blog/blogTag.service";
import { createCrudController } from "../base.controller";
import {
  getString,
  getNumberOrUndefined,
  isValidSortBy,
  isValidSortOrder,
} from "../../../utils/filterFormatter";

export const { getAll, getById, create, update, remove } = createCrudController(
  blogTagService,
  {
    messages: {
      notFound: "تگی با این شناسه یافت نشد",
      created: "تگ با موفقیت ایجاد شد",
      updated: "تگ با موفقیت ویرایش شد",
      deleted: "تگ با موفقیت حذف شد",
    },
    buildFilters: (req) => {
      const { name, slug, sortBy, sortOrder, page, limit } = req.query;
      return {
        name: getString(name),
        slug: getString(slug),
        sortBy: isValidSortBy(sortBy) ? sortBy : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? sortOrder : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
      };
    },
  }
);
