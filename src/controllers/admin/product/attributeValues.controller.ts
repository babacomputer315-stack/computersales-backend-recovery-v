import { createCrudController } from "../base.controller";
import {
  getString,
  getNumberOrUndefined,
  isValidSortBy,
  isValidSortOrder,
} from "../../../utils/filterFormatter";
import { attributeValuesService } from "../../../services/admin/product/attributeValues.service";

export const { getAll, getById, create, update, remove } = createCrudController(
  attributeValuesService,
  {
    messages: {
      notFound: "مشخصه ای با این شناسه یافت نشد",
    },
    buildFilters: (req) => {
      const { name, attributeId, sortBy, sortOrder, page, limit } = req.query;

      return {
        value: getString(name),
        attributeId: getNumberOrUndefined(attributeId),
        sortBy: isValidSortBy(sortBy) ? (sortBy as any) : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as any) : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
      };
    },
  }
);
