import { db } from "../db/client";
import { products } from "../db/schema/product/product";
import { eq, and, sql } from "drizzle-orm";

export class TorobService {
  static async getAll(
    options: {
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { page = 1, limit = 20 } = options;

    const whereClauses = [eq(products.isPublished, true)];

    // ✅ فقط محصولاتی که خودشون یا variation قیمت دارند
    whereClauses.push(sql`
      (
        ${products.regularPrice} IS NOT NULL
        OR ${products.salePrice} IS NOT NULL
        OR EXISTS (
          SELECT 1 FROM product_variations pv
          WHERE pv.product_id = ${products.id}
          AND (pv.price IS NOT NULL OR pv.sale_price IS NOT NULL)
        )
      )
    `);

    const where = and(...whereClauses);

    const offset = (page - 1) * limit;

    // ✅ Query فقط محصولات دارای قیمت را می‌آورد
    const data = await db.query.products.findMany({
      where,
      limit,
      offset,
      orderBy: (fields, { desc }) => [
        desc(fields.createdAt),
        desc(fields.updatedAt),
      ],
      with: {
        variations: true,
      },
    });

    // ✅ شمارش دقیق فقط بر اساس محصولات دارای قیمت
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(products)
      .where(where);

    const productData = data.map((product) => {
      // اگر variation دارد
      if (product.variations && product.variations.length > 0) {
        const validVariations = product.variations.filter(
          (v) => v.price || v.salePrice
        );
        if (validVariations.length === 0) {
          return null;
        }

        const variationWithLowestPrice = validVariations.reduce((min, v) => {
          const vPrice = v.salePrice ?? v.price ?? Infinity;
          const minPrice = min.salePrice ?? min.price ?? Infinity;
          return vPrice < minPrice ? v : min;
        });

        const price =
          variationWithLowestPrice.salePrice ?? variationWithLowestPrice.price;
        const oldPrice =
          variationWithLowestPrice.salePrice &&
          variationWithLowestPrice.salePrice <
            (variationWithLowestPrice.price ?? Infinity)
            ? variationWithLowestPrice.price
            : undefined;

        return {
          product_id: product.id,
          price,
          old_price: oldPrice,
          page_url: `${process.env.SITE_URL}/products/${product.slug}`,
          availability:
            variationWithLowestPrice.stockStatus === "instock"
              ? "instock"
              : "outofstock",
        };
      }

      // اگر variation ندارد ولی خودش قیمت دارد
      const price = product.salePrice ?? product.regularPrice;
      const oldPrice =
        product.salePrice &&
        product.salePrice < (product.regularPrice ?? Infinity)
          ? product.regularPrice
          : undefined;

      return {
        product_id: product.id,
        price,
        old_price: oldPrice,
        page_url: `${process.env.SITE_URL}/products/${product.slug}`,
        availability:
          product.stockStatus === "instock" ? "instock" : "outofstock",
      };
    });

    return {
      data: productData.filter((p) => p !== null),
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }
}

// import { db } from "../db/client";
// import { products } from "../db/schema/product/product";
// import { eq, and, sql, gt } from "drizzle-orm";

// export class TorobService {
//   static async getAll(
//     options: {
//       page?: number;
//       limit?: number;
//     } = {}
//   ) {
//     const { page = 1, limit = 20 } = options;

//     const whereClauses = [];

//     // Only show published products
//     whereClauses.push(eq(products.isPublished, true));

//     // whereClauses.push(gt(products.regularPrice, 0));

//     // Filter by name
//     const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

//     // Pagination
//     const offset = (page - 1) * limit;

//     // Main query
//     const data = await db.query.products.findMany({
//       where,
//       limit,
//       offset,
//       orderBy: (fields, { desc }) => [
//         desc(fields.createdAt),
//         desc(fields.updatedAt),
//       ],
//       with: {
//         images: {
//           with: { file: true },
//           orderBy: (fields, { asc }) => asc(fields.order),
//         },
//         categories: {
//           with: { category: true },
//         },
//         variations: {
//           with: {
//             attributeValues: {
//               with: {
//                 attributeValue: {
//                   with: { attribute: true, file: true },
//                 },
//               },
//             },
//             imageFile: true,
//           },
//         },
//       },
//     });

//     // Get total count for pagination
//     const [{ count }] = await db
//       .select({ count: sql<number>`COUNT(*)::int` })
//       .from(products)
//       .where(where ?? sql`true`);

//     const productData = data
//       .map((product) => {
//         // اگر variation دارد، کمترین قیمت را پیدا کن
//         if (product.variations && product.variations.length > 0) {
//           const validVariations = product.variations.filter(
//             (v) => v.price || v.salePrice
//           );

//           if (validVariations.length === 0) return null;

//           const variationWithLowestPrice = validVariations.reduce((min, v) => {
//             const vPrice = v.salePrice ?? v.price ?? Infinity;
//             const minPrice = min.salePrice ?? min.price ?? Infinity;
//             return vPrice < minPrice ? v : min;
//           });

//           const price =
//             variationWithLowestPrice.salePrice ??
//             variationWithLowestPrice.price;
//           const oldPrice =
//             variationWithLowestPrice.salePrice &&
//             variationWithLowestPrice.salePrice <
//               (variationWithLowestPrice.price ?? Infinity)
//               ? variationWithLowestPrice.price
//               : undefined;

//           return {
//             product_id: product.id,
//             price,
//             old_price: oldPrice,
//             page_url: `${process.env.SITE_URL}/products/${product.slug}`,
//             availability:
//               variationWithLowestPrice.stockStatus === "instock"
//                 ? "instock"
//                 : "outofstock",
//           };
//         }

//         // اگر variation ندارد، از خود محصول استفاده کن
//         if (!product.regularPrice && !product.salePrice) return null;

//         const price = product.salePrice ?? product.regularPrice;
//         const oldPrice =
//           product.salePrice &&
//           product.salePrice < (product.regularPrice ?? Infinity)
//             ? product.regularPrice
//             : undefined;

//         return {
//           product_id: product.id,
//           price,
//           old_price: oldPrice,
//           page_url: `${process.env.SITE_URL}/products/${product.slug}`,
//           availability:
//             product.stockStatus === "instock" ? "instock" : "outofstock",
//         };
//       })
//       .filter((p) => p !== null); // حذف محصولات بدون قیمت
//     console.log(productData.length);
//     return {
//       data: productData,
//       pagination: {
//         page,
//         limit,
//         total: count,
//         pages: Math.ceil(count / limit),
//       },
//     };
//   }
// }
