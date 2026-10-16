import { db } from "../../db/client";
import { products } from "../../db/schema/product/product";
import { productToCategories } from "../../db/schema/product/productToCategories";
import { productToTags } from "../../db/schema/product/productToTags";
import { productSpecifications } from "../../db/schema/product/productSpecifications";
import { productSpecificationOptions } from "../../db/schema/product/productSpecificationOptions";
import { categoryToSpecifications } from "../../db/schema/product/categoryToSpecifications";
import {
  eq,
  and,
  ilike,
  exists,
  inArray,
  sql,
  or,
  gte,
  lte,
  gt,
  isNotNull,
} from "drizzle-orm";
import { NotFoundException } from "../../utils/apiResponse";

export class UserProductService {
  static async getAll(
    options: {
      page?: number;
      limit?: number;
      sortBy?:
      | "name"
      | "createdAt"
      | "regularPrice"
      | "salePrice"
      | "stockQuantity"
      | "discount";
      sortOrder?: "asc" | "desc";
      filters?: {
        name?: string;
        categoryId?: number;
        categoryIds?: number[];
        tagId?: number;
        minPrice?: number;
        maxPrice?: number;
        isFeatured?: boolean;
        inStock?: boolean;
        specificationOptionIds?: number[];
        withSpecifications?: boolean;
        brandId?: number;
      };
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      filters = {},
    } = options;

    const whereClauses = [];

    // Only show published products
    whereClauses.push(eq(products.isPublished, true));

    // whereClauses.push(gt(products.regularPrice, 0));

    // Filter by name
    if (filters.name) {
      whereClauses.push(ilike(products.name, `%${filters.name}%`));
    }

    // Filter by category (single)
    if (filters.categoryId) {
      whereClauses.push(
        exists(
          db
            .select()
            .from(productToCategories)
            .where(
              and(
                eq(productToCategories.productId, products.id),
                eq(productToCategories.categoryId, filters.categoryId)
              )
            )
        )
      );
    }

    // Filter by categories (multiple)
    if (filters.categoryIds?.length) {
      whereClauses.push(
        exists(
          db
            .select()
            .from(productToCategories)
            .where(
              and(
                eq(productToCategories.productId, products.id),
                inArray(productToCategories.categoryId, filters.categoryIds)
              )
            )
        )
      );
    }

    // Filter by tag
    if (filters.tagId) {
      whereClauses.push(
        exists(
          db
            .select()
            .from(productToTags)
            .where(
              and(
                eq(productToTags.productId, products.id),
                eq(productToTags.tagId, filters.tagId)
              )
            )
        )
      );
    }

    // Filter by price range
    if (filters.minPrice !== undefined) {
      whereClauses.push(gte(products.regularPrice, filters.minPrice));
    }
    if (filters.maxPrice !== undefined) {
      whereClauses.push(lte(products.regularPrice, filters.maxPrice));
    }

    // Filter by featured
    if (filters.isFeatured !== undefined) {
      whereClauses.push(eq(products.isFeatured, filters.isFeatured));
    }

    if (filters.brandId) {
      whereClauses.push(eq(products.brandId, filters.brandId));
    }

    // Filter by stock status
    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        whereClauses.push(eq(products.stockStatus, "instock"));
      } else {
        whereClauses.push(eq(products.stockStatus, "outofstock"));
      }
    }
    // Filter by specification options
    if (filters.specificationOptionIds?.length) {
      whereClauses.push(
        exists(
          db
            .select()
            .from(productSpecifications)
            .leftJoin(
              productSpecificationOptions,
              eq(
                productSpecificationOptions.productSpecificationId,
                productSpecifications.id
              )
            )
            .where(
              and(
                eq(productSpecifications.productId, products.id),
                or(
                  // For single select specifications (optionId is set)
                  inArray(
                    productSpecifications.optionId,
                    filters.specificationOptionIds
                  ),
                  // For multi-select specifications (optionId is in productSpecificationOptions)
                  inArray(
                    productSpecificationOptions.optionId,
                    filters.specificationOptionIds
                  )
                )
              )
            )
        )
      );
    }

    const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

    // Pagination
    const offset = (page - 1) * limit;

    // ساختن بخش with به صورت دینامیک
    const withRelations: any = {
      shippingClass: true,
      tags: { with: { tag: true } },
      images: {
        with: { file: true },
        orderBy: (fields: any, { asc }: any) => asc(fields.order),
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
    };

    // فقط در صورت نیاز، specifications اضافه کن
    if (filters.withSpecifications) {
      withRelations.specifications = {
        with: {
          specification: true,
          option: true,
          selectedOptions: {
            with: {
              option: true,
            },
          },
        },
      };
    }

    // Main query
    const data = await db.query.products.findMany({
      where,
      limit,
      offset,
      orderBy: (fields, { asc, desc }) => {
        // Handle discount sorting specially (computed field)
        if (sortBy === "discount") {
          // Sort by (regularPrice - salePrice) - higher discount first when desc
          const discountExpr = sql`COALESCE(${fields.regularPrice}, 0) - COALESCE(${fields.salePrice}, 0)`;
          return sortOrder === "asc" ? asc(discountExpr) : desc(discountExpr);
        }

        const field = fields[sortBy as keyof typeof fields];
        return sortOrder === "asc" ? asc(field) : desc(field);
      },
      with: withRelations,
    });

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(products)
      .where(where ?? sql`true`);

    const productsMaxPrice = await db.query.products.findFirst({
      columns: {
        regularPrice: true,
      },
      where: (fields) => isNotNull(fields.regularPrice),
      orderBy: (fields, { desc }) => desc(fields.regularPrice),
    });
    const productsMinPrice = await db.query.products.findFirst({
      columns: {
        regularPrice: true,
      },
      where: (fields) => isNotNull(fields.regularPrice),
      orderBy: (fields, { asc }) => asc(fields.regularPrice),
    });

    return {
      data,
      productsMinPrice: productsMinPrice?.regularPrice,
      productsMaxPrice: productsMaxPrice?.regularPrice,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  static async getById(id: number) {
    const result = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.isPublished, true)),
      with: {
        shippingClass: true,
        tags: {
          with: { tag: true },
        },
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
                  with: { attribute: true },
                },
              },
            },
            imageFile: true,
          },
        },
        specifications: {
          with: {
            specification: true,
            option: true,
            selectedOptions: {
              with: {
                option: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException("Product not found");
    }

    const resultWithOrder = await UserProductService.attachSpecificationsOrder(
      result
    );
    return resultWithOrder;
  }

  static async getBySlug(slug: string) {
    const result = await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.isPublished, true)),
      with: {
        brand: {
          with: {
            image: true,
          },
        },
        shippingClass: true,
        tags: {
          with: { tag: true },
        },
        images: {
          with: { file: true },
          orderBy: (fields, { asc }) => asc(fields.order),
        },
        categories: {
          with: { category: true },
        },
        variations: {
          where: (productVariations, { eq }) =>
            eq(productVariations.isArchived, false),
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
        specifications: {
          with: {
            specification: true,
            option: true,
            selectedOptions: {
              with: {
                option: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException("Product not found");
    }

    const resultWithOrder = await UserProductService.attachSpecificationsOrder(
      result
    );
    return resultWithOrder;
  }

  static async getFeatured(limit: number = 10) {
    return db.query.products.findMany({
      where: and(eq(products.isPublished, true), eq(products.isFeatured, true)),
      limit,
      orderBy: (fields, { desc }) => desc(fields.createdAt),
      with: {
        shippingClass: true,
        tags: {
          with: { tag: true },
        },
        images: {
          with: { file: true },
          orderBy: (fields, { asc }) => asc(fields.order),
        },
        categories: {
          with: { category: true },
        },
      },
    });
  }

  static async getRelatedProducts(productId: number, limit: number = 8) {
    // Get the product's primary category
    const productCategory = await db.query.productToCategories.findFirst({
      where: and(
        eq(productToCategories.productId, productId),
        eq(productToCategories.isPrimary, true)
      ),
      with: { category: true },
    });

    if (!productCategory) {
      return [];
    }

    // Get products from the same category
    return db.query.products.findMany({
      where: and(
        eq(products.isPublished, true),
        exists(
          db
            .select()
            .from(productToCategories)
            .where(
              and(
                eq(productToCategories.productId, products.id),
                eq(productToCategories.categoryId, productCategory.categoryId),
                eq(productToCategories.productId, productId)
              )
            )
        )
      ),
      limit,
      orderBy: (fields, { desc }) => desc(fields.createdAt),
      with: {
        shippingClass: true,
        tags: {
          with: { tag: true },
        },
        images: {
          with: { file: true },
          orderBy: (fields, { asc }) => asc(fields.order),
        },
        categories: {
          with: { category: true },
        },
      },
    });
  }

  static async search(query: string, limit: number = 20) {
    return db.query.products.findMany({
      where: and(
        eq(products.isPublished, true),
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.shortDescription, `%${query}%`),
          ilike(products.sku, `%${query}%`)
        )
      ),
      limit,
      orderBy: (fields, { desc }) => desc(fields.createdAt),
      with: {
        shippingClass: true,
        tags: {
          with: { tag: true },
        },
        images: {
          with: { file: true },
          orderBy: (fields, { asc }) => asc(fields.order),
        },
        categories: {
          with: { category: true },
        },
      },
    });
  }

  static async getBySpecificationOptions(
    specificationOptionIds: number[],
    options: {
      page?: number;
      limit?: number;
      sortBy?:
      | "name"
      | "createdAt"
      | "regularPrice"
      | "salePrice"
      | "stockQuantity"
      | "discount";
      sortOrder?: "asc" | "desc";
      categoryId?: number;
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      categoryId,
    } = options;

    const whereClauses = [
      eq(products.isPublished, true),
      exists(
        db
          .select()
          .from(productSpecifications)
          .leftJoin(
            productSpecificationOptions,
            eq(
              productSpecificationOptions.productSpecificationId,
              productSpecifications.id
            )
          )
          .where(
            and(
              eq(productSpecifications.productId, products.id),
              or(
                // For single select specifications (optionId is set)
                inArray(productSpecifications.optionId, specificationOptionIds),
                // For multi-select specifications (optionId is in productSpecificationOptions)
                inArray(
                  productSpecificationOptions.optionId,
                  specificationOptionIds
                )
              )
            )
          )
      ),
    ];

    // Filter by category if provided
    if (categoryId) {
      whereClauses.push(
        exists(
          db
            .select()
            .from(productToCategories)
            .where(
              and(
                eq(productToCategories.productId, products.id),
                eq(productToCategories.categoryId, categoryId)
              )
            )
        )
      );
    }

    const where = and(...whereClauses);
    const offset = (page - 1) * limit;

    // Main query
    const data = await db.query.products.findMany({
      where,
      limit,
      offset,
      orderBy: (fields, { asc, desc }) => {
        // Handle discount sorting specially (computed field)
        if (sortBy === "discount") {
          // Sort by (regularPrice - salePrice) - higher discount first when desc
          const discountExpr = sql`COALESCE(${fields.regularPrice}, 0) - COALESCE(${fields.salePrice}, 0)`;
          return sortOrder === "asc" ? asc(discountExpr) : desc(discountExpr);
        }

        const field = fields[sortBy as keyof typeof fields];
        return sortOrder === "asc" ? asc(field) : desc(field);
      },
      with: {
        shippingClass: true,
        tags: {
          with: { tag: true },
        },
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
        specifications: {
          with: {
            specification: true,
            option: true,
            selectedOptions: {
              with: {
                option: true,
              },
            },
          },
        },
      },
    });

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(products)
      .where(where);

    const dataWithOrder = await Promise.all(
      data.map((p) => UserProductService.attachSpecificationsOrder(p))
    );

    return {
      data: dataWithOrder,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }
}

// Helper: attach and sort specifications by category-to-spec order
export namespace UserProductService {
  export async function attachSpecificationsOrder<
    T extends { categories?: any[]; specifications?: any[] }
  >(product: T): Promise<T> {
    if (!product?.specifications?.length) return product;
    const primaryCategory =
      product.categories?.find((c) => c.isPrimary) ?? product.categories?.[0];
    const primaryCategoryId = primaryCategory?.categoryId;
    if (!primaryCategoryId) return product;

    const catSpecs = await db.query.categoryToSpecifications.findMany({
      where: eq(categoryToSpecifications.categoryId, primaryCategoryId),
    });

    const specIdToOrder = new Map<number, number>();
    for (const cs of catSpecs) {
      specIdToOrder.set(cs.specificationId, cs.order ?? 0);
    }

    const specsWithOrder = product.specifications
      .map((ps: any) => ({
        ...ps,
        order: specIdToOrder.get(ps.specificationId) ?? 0,
      }))
      .sort((a: any, b: any) => a.order - b.order);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - mutate for convenience
    product.specifications = specsWithOrder;
    return product;
  }
}
