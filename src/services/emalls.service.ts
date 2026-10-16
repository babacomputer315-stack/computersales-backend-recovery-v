// import { db } from "../db/client";
// import { products } from "../db/schema/product/product";
// import { eq, and, sql, gt } from "drizzle-orm";

// export class EmallsService {
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

//     // ✅ فقط محصولاتی که خودشون یا variation قیمت دارن
//     whereClauses.push(sql`
//         (
//           ${products.regularPrice} IS NOT NULL
//           OR ${products.salePrice} IS NOT NULL
//           OR EXISTS (
//             SELECT 1 FROM product_variations pv
//             WHERE pv.product_id = ${products.id}
//             AND (pv.price IS NOT NULL OR pv.sale_price IS NOT NULL)
//           )
//         )
//       `);

//     // whereClauses.push(gt(products.regularPrice, 0));

//     const where = and(...whereClauses);

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

//     console.log(data.length);

//     const productData = data
//       .map((product) => {
//         // اگر variation دارد، کمترین قیمت را پیدا کن
//         if (product.variations && product.variations.length > 0) {
//           const validVariations = product.variations.filter(
//             (v) => v.price || v.salePrice
//           );

//           if (validVariations.length === 0) {
//             return null;
//           }

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
//             id: product.id,
//             title: product.name,
//             price,
//             old_price: oldPrice,
//             category: product.categories.find((c) => c?.isPrimary)?.category
//               ?.name,
//             url: `${process.env.SITE_URL}/products/${product.slug}`,
//             is_available: variationWithLowestPrice.stockStatus === "instock",
//             image: `${process.env.FILE_URL}/${
//               product.images?.find((image) => image.isThumbnail)?.file.name
//             }`,
//             guarantee: variationWithLowestPrice?.attributeValues?.find(
//               (v) => v?.attributeValue?.attribute?.slug === "warranty"
//             )?.attributeValue?.value,
//           };
//         }

//         // اگر variation ندارد، از خود محصول استفاده کن
//         // if (!product.regularPrice && !product.salePrice) {
//         //   return null;
//         // }

//         const price = product.salePrice ?? product.regularPrice;
//         const oldPrice =
//           product.salePrice &&
//           product.salePrice < (product.regularPrice ?? Infinity)
//             ? product.regularPrice
//             : undefined;

//         return {
//           id: product.id,
//           title: product.name,
//           price,
//           old_price: oldPrice,
//           category: product.categories.find((c) => c?.isPrimary)?.category
//             ?.name,
//           url: `${process.env.SITE_URL}/products/${product.slug}`,
//           is_available: product.stockStatus === "instock",
//           image: `${process.env.FILE_URL}/${
//             product.images?.find((image) => image.isThumbnail)?.file.name
//           }`,
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

import { db } from "../db/client";
import { products } from "../db/schema/product/product";
import { eq, and, sql } from "drizzle-orm";

export class EmallsService {
  static async getAll(
    options: {
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { page = 1, limit = 20 } = options;

    const whereClauses = [eq(products.isPublished, true)];

    // ✅ فقط محصولاتی که خودشون یا variation قیمت دارن
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

    // حالا query فقط محصولاتی رو میاره که واقعاً قیمت دارن
    const data = await db.query.products.findMany({
      where,
      limit,
      offset,
      orderBy: (fields, { desc }) => [
        desc(fields.createdAt),
        desc(fields.updatedAt),
      ],
      with: {
        images: {
          with: { file: true },
          orderBy: (fields, { asc }) => asc(fields.order),
        },
        categories: {
          with: { category: true },
        },
        variations: {
          with: {
            attributeValues: {
              with: {
                attributeValue: {
                  with: { attribute: true, file: true },
                },
              },
            },
            imageFile: true,
          },
        },
      },
    });

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(products)
      .where(where);

    const productData = data.map((product) => {
      // ✅ همان منطق قبلی محاسبه قیمت‌ها
      if (product.variations && product.variations.length > 0) {
        const validVariations = product.variations.filter(
          (v) => v.price || v.salePrice
        );
        if (validVariations.length === 0) return null;

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
          id: product.id,
          title: product.name,
          price,
          old_price: oldPrice,
          category: product.categories.find((c) => c?.isPrimary)?.category
            ?.name,
          url: `${process.env.SITE_URL}/products/${product.slug}`,
          is_available: variationWithLowestPrice.stockStatus === "instock",
          image: `${process.env.FILE_URL}/${
            product.images?.find((image) => image.isThumbnail)?.file.name
          }`,
          guarantee: variationWithLowestPrice?.attributeValues?.find(
            (v) => v?.attributeValue?.attribute?.slug === "warranty"
          )?.attributeValue?.value,
        };
      }

      // محصول بدون variation ولی با قیمت
      const price = product.salePrice ?? product.regularPrice;
      const oldPrice =
        product.salePrice &&
        product.salePrice < (product.regularPrice ?? Infinity)
          ? product.regularPrice
          : undefined;

      return {
        id: product.id,
        title: product.name,
        price,
        old_price: oldPrice,
        category: product.categories.find((c) => c?.isPrimary)?.category?.name,
        url: `${process.env.SITE_URL}/products/${product.slug}`,
        is_available: product.stockStatus === "instock",
        image: `${process.env.FILE_URL}/${
          product.images?.find((image) => image.isThumbnail)?.file.name
        }`,
      };
    });

    return {
      data: productData,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }
}
