import { blogCategoryService } from "../../../services/admin/blog/blogCategory.service";
import { createCrudController } from "../base.controller";
import {
  getString,
  getNumberOrUndefined,
  isValidSortBy,
  isValidSortOrder,
} from "../../../utils/filterFormatter";

export const { getAll, getById, create, update, remove } = createCrudController(
  blogCategoryService,
  {
    messages: {
      notFound: "دسته‌بندی با این شناسه یافت نشد",
      created: "دسته‌بندی با موفقیت ایجاد شد",
      updated: "دسته‌بندی با موفقیت ویرایش شد",
      deleted: "دسته‌بندی با موفقیت حذف شد",
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
