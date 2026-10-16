import { specifications } from "../../../db/schema/product/specifications";
import { createCrudService } from "../base.service";

export const specificationService = createCrudService({
  table: specifications as any,
  getId: (t) => t.id,
  searchableFields: ["name", "slug"],
  sortableFields: ["name", "createdAt", "updatedAt"],
});
