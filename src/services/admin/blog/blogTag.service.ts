import { blogTags } from "../../../db/schema/blog/blogTags";
import { createCrudService } from "../base.service";

export const blogTagService = createCrudService({
  table: blogTags as any,
  getId: (table) => table.id,
  slugColumn: blogTags.slug,
  searchableFields: ["name", "slug"],
  sortableFields: ["name", "createdAt"],
});
