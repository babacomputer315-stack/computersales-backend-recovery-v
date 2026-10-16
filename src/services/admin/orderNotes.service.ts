import { orderNotes } from "../../db/schema/order/orderNotes";
import { createCrudService } from "./base.service";

export const orderNoteService = createCrudService({
  table: orderNotes as any,
  getId: (t) => t.id,
  searchableFields: ["note"],
  sortableFields: ["createdAt"],
});
