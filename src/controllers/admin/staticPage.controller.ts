import { staticPageService } from "../../services/admin/staticPage.service";
import { createCrudController } from "./base.controller";
import {
  getString,
  getNumberOrUndefined,
  isValidSortBy,
  isValidSortOrder,
} from "../../utils/filterFormatter";

export const { getAll, getById, create, update, remove } = createCrudController(
  staticPageService,
  {
    messages: {
      notFound: "صفحه ای با این شناسه یافت نشد",
    },
    buildFilters: (req) => {
      const { title, slug, sortBy, sortOrder, page, limit } = req.query;

      return {
        title: getString(title),
        slug: getString(slug),
        sortBy: isValidSortBy(sortBy) ? (sortBy as any) : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as any) : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
      };
    },
  }
);
