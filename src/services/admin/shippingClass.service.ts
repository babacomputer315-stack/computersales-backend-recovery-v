import { shippingClasses } from "../../db/schema";
import { createCrudService } from "./base.service";

export const shippingClassService = createCrudService({
  table: shippingClasses as any,
  getId: (shippingClasses) => shippingClasses.id,
  searchableFields: ["name"],
  sortableFields: ["name"],
});
