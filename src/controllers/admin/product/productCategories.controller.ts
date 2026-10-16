import { productCategoryService } from "../../../services/admin/product/productCategory.service";
import { createCrudController } from "../base.controller";
import {
  getString,
  getNumberOrUndefined,
  isValidSortBy,
  isValidSortOrder,
} from "../../../utils/filterFormatter";

export const { getAll, getById, create, update, remove } = createCrudController(
  productCategoryService,
  {
    messages: {
      notFound: "دسته‌بندی‌ای با این شناسه یافت نشد",
    },
    buildFilters: (req) => {
      const {
        name,
        slug,
        sortBy = "order",
        sortOrder = "asc",
        page,
        limit,
        tree,
      } = req.query;

      return {
        name: getString(name),
        slug: getString(slug),
        sortBy: isValidSortBy(sortBy) ? (sortBy as any) : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as any) : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
        tree: getString(tree),
      };
    },
  }
);
