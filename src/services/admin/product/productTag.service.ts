import { productTags } from "../../../db/schema";
import { createCrudService } from "../base.service";
import { productToTags } from "../../../db/schema";
import { sql } from "drizzle-orm";

// export const productTagService = createCrudService({
//   table: productTags as any,
//   getId: (t) => t.id,
//   slugColumn: productTags.slug,
//   searchableFields: ["name", "slug"],
//   sortableFields: ["name", "createdAt", "updatedAt"],
//   joins: [
//     {
//       alias: productToTags as any,
//       condition: sql`${productTags.id} = ${productToTags.tagId}`,
//       select: {
//         count: sql<number>`count(${productToTags.tagId})::int`.as(
//           "productCount"
//         ),
//       },
//       key: "productCount",
//       isGrouped: true,
//     },
//   ],
// });

// export const productTagService = createCrudService({
//   table: productTags as any,
//   getId: (t) => t.id,
//   slugColumn: productTags.slug,
//   searchableFields: ["name", "slug"],
//   sortableFields: ["name", "createdAt", "updatedAt"],
//   joins: [
//     {
//       alias: productToTags as any,
//       condition: sql`${productTags.id} = ${productToTags.tagId}`,
//       select: {
//         productCount: sql<number>`(
//           SELECT COUNT(*)
//           FROM ${productToTags}
//           WHERE ${productToTags.tagId} = ${productTags.id}
//         )::int`,
//       },
//       key: "productCount",
//     },
//   ],
// });

// import { productTags, productToTags } from "../../../db/schema";
// import { createCrudService } from "../base.service";
// import { sql } from "drizzle-orm";

export const productTagService = createCrudService({
  table: productTags as any,
  getId: (t) => t.id,
  slugColumn: productTags.slug,
  searchableFields: ["name", "slug"],
  sortableFields: ["name", "slug", "productCount", "createdAt", "updatedAt"],
  joins: [
    {
      alias: productToTags as any,
      condition: sql`${productTags.id} = ${productToTags.tagId}`,
      select: {
        productCount: sql<number>`COUNT(${productToTags.productId})::int`.as(
          "productCount"
        ),
      },
      key: "productCount",
      isGrouped: true,
    },
  ],
});
