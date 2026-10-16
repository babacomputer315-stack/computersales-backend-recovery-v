import { shippingClassService } from "../../services/admin/shippingClass.service";
import { createCrudController } from "./base.controller";
import {
  getString,
  getNumberOrUndefined,
  isValidSortBy,
  isValidSortOrder,
} from "../../utils/filterFormatter";

export const { getAll, getById, create, update, remove } = createCrudController(
  shippingClassService,
  {
    messages: {
      notFound: "کلاس حمل و نقل با این شناسه یافت نشد",
    },
    buildFilters: (req) => {
      const { name, sortBy, sortOrder, page, limit } = req.query;

      return {
        name: getString(name),
        sortBy: isValidSortBy(sortBy) ? (sortBy as any) : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as any) : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
      };
    },
  }
);
