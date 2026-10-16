import { userService } from "../../services/admin/user.service";
import { createCrudController } from "./base.controller";
import {
  getString,
  getNumberOrUndefined,
  isValidSortBy,
  isValidSortOrder,
} from "../../utils/filterFormatter";

export const { getAll, getById, create, update, remove } = createCrudController(
  userService,
  {
    messages: {
      notFound: "کاربری با این شناسه یافت نشد",
    },
    buildFilters: (req) => {
      const { name, mobile, sortBy, sortOrder, page, limit } = req.query;

      return {
        name: getString(name),
        mobile: getString(mobile),
        sortBy: isValidSortBy(sortBy) ? (sortBy as any) : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as any) : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
      };
    },
  }
);
