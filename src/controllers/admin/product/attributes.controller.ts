import { createCrudController } from "../base.controller";
import {
  getString,
  getNumberOrUndefined,
  isValidSortBy,
  isValidSortOrder,
} from "../../../utils/filterFormatter";
import { attributeService } from "../../../services/admin/product/attribute.service";

export const { getAll, getById, create, update, remove } = createCrudController(
  attributeService,
  {
    messages: {
      notFound: "ویژگی با این شناسه یافت نشد",
    },
    buildFilters: (req) => {
      const { name, slug, sortBy, sortOrder, page, limit } = req.query;

      return {
        name: getString(name),
        slug: getString(slug),
        sortBy: isValidSortBy(sortBy) ? (sortBy as any) : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as any) : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
      };
    },
  }
);
