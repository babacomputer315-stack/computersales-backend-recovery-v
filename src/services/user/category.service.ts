import { db } from "../../db/client";
import { productCategories } from "../../db/schema/product/productCategories";
import { productToCategories } from "../../db/schema/product/productToCategories";
import { products } from "../../db/schema/product/product";
import { eq, and, sql, desc, asc, exists, like } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { files } from "../../db/schema";

export class UserCategoryService {
  static async getAll() {
    return db.query.productCategories.findMany({
      orderBy: (fields, { asc }) => asc(fields.name),
    });
  }

  static async getById(id: number) {
    const result = await db.query.productCategories.findFirst({
      where: eq(productCategories.id, id),
    });

    if (!result) {
      throw new Error("Category not found");
    }

    const children = await db.query.productCategories.findMany({
      where: eq(productCategories.parentId, id),
      with: {
        image: true,
      },
    });

    return {
      ...result,
      children,
    };
  }

  static async getBySlug(slug: string) {
    const result = await db.query.productCategories.findFirst({
      where: eq(productCategories.slug, slug),
    });

    if (!result) {
      throw new Error("Category not found");
    }

    const children = await db.query.productCategories.findMany({
      where: eq(productCategories.parentId, result?.id),
    });

    return {
      ...result,
      children,
    };
  }

  static async getWithProductCount() {
    const categories = await db.query.productCategories.findMany({
      orderBy: (fields, { asc }) => asc(fields.name),
    });

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const [{ count }] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(products)
          .where(
            and(
              eq(products.isPublished, true),
              exists(
                db
                  .select()
                  .from(productToCategories)
                  .where(
                    and(
                      eq(productToCategories.productId, products.id),
                      eq(productToCategories.categoryId, category.id)
                    )
                  )
              )
            )
          );

        return {
          ...category,
          productCount: count,
        };
      })
    );

    return categoriesWithCount;
  }

  static async getPopularCategories(limit: number = 10) {
    const result = await db
      .select({
        categoryId: productToCategories.categoryId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(productToCategories)
      .innerJoin(products, eq(productToCategories.productId, products.id))
      .where(eq(products.isPublished, true))
      .groupBy(productToCategories.categoryId)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);

    const categoryIds = result.map((r) => r.categoryId);

    if (categoryIds.length === 0) {
      return [];
    }

    const categories = await db.query.productCategories.findMany({
      where: sql`${productCategories.id} = ANY(${categoryIds})`,
    });

    // Map categories with their counts
    return categories.map((category) => {
      const countData = result.find((r) => r.categoryId === category.id);
      return {
        ...category,
        productCount: countData?.count || 0,
      };
    });
  }

  static parentCategory = alias(productCategories, "parent_category");

  static async getTree() {
    const categories = await db
      .select({
        id: productCategories.id,
        name: productCategories.name,
        slug: productCategories.slug,
        parentId: productCategories.parentId,
        imageId: productCategories.imageId,
        bannerId: productCategories.bannerId,
        description: productCategories.description,
        seoTitle: productCategories.seoTitle,
        seoDescription: productCategories.seoDescription,
        createdAt: productCategories.createdAt,
        updatedAt: productCategories.updatedAt,
        order: productCategories.order,
        parent: {
          id: UserCategoryService.parentCategory.id,
          name: UserCategoryService.parentCategory.name,
          slug: UserCategoryService.parentCategory.slug,
        },
        image: {
          id: files.id,
          name: files.name,
        },
      })

      .from(productCategories)
      .leftJoin(
        UserCategoryService.parentCategory,
        eq(productCategories.parentId, UserCategoryService.parentCategory.id)
      )
      .leftJoin(files, eq(productCategories.imageId, files.id))
      .where(undefined)
      .orderBy(asc(productCategories.order));

    const productCounts = await db
      .select({
        categoryId: productToCategories.categoryId,
        count: sql<number>`count(*)::int`,
      })
      .from(productToCategories)
      .groupBy(productToCategories.categoryId);

    const countMap = new Map<number, number>();
    for (const row of productCounts) {
      countMap.set(row.categoryId, row.count);
    }

    const categoryMap = new Map<number, any>();
    const treeData: any[] = [];

    for (const cat of categories) {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
        productCount: countMap.get(cat.id) || 0,
      });
    }

    for (const cat of categories) {
      const current = categoryMap.get(cat.id);
      if (cat.parentId && cat.parentId !== cat.id) {
        const parent = categoryMap.get(cat.parentId as number);
        if (parent) {
          parent.children.push(current);
        } else {
          treeData.push(current);
        }
      } else {
        treeData.push(current);
      }
    }

    return treeData;
  }
}
