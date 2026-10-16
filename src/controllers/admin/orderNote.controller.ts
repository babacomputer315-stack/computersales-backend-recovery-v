import { orderNoteService } from "../../services/admin/orderNotes.service";
import { createCrudController } from "./base.controller";
import {
  getNumberOrUndefined,
  getString,
  isValidSortBy,
  isValidSortOrder,
} from "../../utils/filterFormatter";

export const {
  getAll: getAllOrderNotes,
  getById: getOrderNoteById,
  create: createOrderNote,
  update: updateOrderNote,
  remove: deleteOrderNote,
} = createCrudController(orderNoteService, {
  messages: {
    notFound: "یادداشتی با این شناسه یافت نشد",
    created: "یادداشت با موفقیت ثبت شد",
    updated: "یادداشت با موفقیت ویرایش شد",
    deleted: "یادداشت با موفقیت حذف شد",
  },
  buildFilters: (req) => {
    const { note, orderId, sortBy, sortOrder, page, limit } = req.query;

    return {
      note: getString(note),
      orderId: getNumberOrUndefined(orderId),
      sortBy: isValidSortBy(sortBy) ? (sortBy as any) : undefined,
      sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as any) : undefined,
      page: getNumberOrUndefined(page),
      limit: getNumberOrUndefined(limit),
    };
  },
});
