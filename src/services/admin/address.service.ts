import { addresses } from "../../db/schema";
import { createCrudService } from "./base.service";

export const addressService = createCrudService({
  table: addresses as any,
  getId: (addresses) => addresses.id,
  searchableFields: ["fullName", "phone", "city", "addressLine"],
  sortableFields: ["createdAt", "fullName"],
});
