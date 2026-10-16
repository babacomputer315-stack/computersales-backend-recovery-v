import { staticPages } from "../../db/schema";
import { createCrudService } from "./base.service";

export const staticPageService = createCrudService({
  table: staticPages as any,
  slugColumn: staticPages.slug,
  getId: (staticPages) => staticPages.id,
  searchableFields: ["title", "slug"],
  sortableFields: ["title"],
});
