import { blogCategories } from "../../../db/schema/blog/blogCategories";
import { createCrudService } from "../base.service";

export const blogCategoryService = createCrudService({
  table: blogCategories as any,
  getId: (table) => table.id,
  slugColumn: blogCategories.slug,
  searchableFields: ["name", "slug"],
  sortableFields: ["name", "createdAt"],
});
