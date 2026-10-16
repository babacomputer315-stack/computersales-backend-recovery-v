import { addressService } from "../../services/admin/address.service";
import { createCrudController } from "./base.controller";
import {
  getString,
  getNumberOrUndefined,
  isValidSortBy,
  isValidSortOrder,
} from "../../utils/filterFormatter";

export const { getAll, getById, create, update, remove } = createCrudController(
  addressService,
  {
    messages: {
      notFound: "آدرسی با این شناسه یافت نشد",
      created: "آدرس با موفقیت ثبت شد",
      updated: "آدرس با موفقیت ویرایش شد",
      deleted: "آدرس با موفقیت حذف شد",
    },
    buildFilters: (req) => {
      return {
        fullName: getString(req.query.fullName),
        phone: getString(req.query.phone),
        city: getString(req.query.city),
        sortBy: isValidSortBy(req.query.sortBy)
          ? (req.query.sortBy as string)
          : undefined,
        sortOrder: isValidSortOrder(req.query.sortOrder)
          ? (req.query.sortOrder as string)
          : undefined,
        page: getNumberOrUndefined(req.query.page),
        limit: getNumberOrUndefined(req.query.limit),
      };
    },
  }
);
