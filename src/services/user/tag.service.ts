import { db } from "../../db/client";
import { productTags } from "../../db/schema/product/productTags";
import { productToTags } from "../../db/schema/product/productToTags";
import { products } from "../../db/schema/product/product";
import { eq, and, sql, desc, asc, exists } from "drizzle-orm";

export class UserTagService {
  static async getAll() {
    return db.query.productTags.findMany({
      orderBy: (fields, { asc }) => asc(fields.name),
    });
  }

  static async getById(id: number) {
    const result = await db.query.productTags.findFirst({
      where: eq(productTags.id, id),
    });

    if (!result) {
      throw new Error("Tag not found");
    }

    return result;
  }

  static async getBySlug(slug: string) {
    const result = await db.query.productTags.findFirst({
      where: eq(productTags.slug, slug),
    });

    if (!result) {
      throw new Error("Tag not found");
    }

    return result;
  }

  static async getWithProductCount() {
    const tags = await db.query.productTags.findMany({
      orderBy: (fields, { asc }) => asc(fields.name),
    });

    // Get product count for each tag
    const tagsWithCount = await Promise.all(
      tags.map(async (tag) => {
        const [{ count }] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(products)
          .where(
            and(
              eq(products.isPublished, true),
              exists(
                db
                  .select()
                  .from(productToTags)
                  .where(
                    and(
                      eq(productToTags.productId, products.id),
                      eq(productToTags.tagId, tag.id)
                    )
                  )
              )
            )
          );

        return {
          ...tag,
          productCount: count,
        };
      })
    );

    return tagsWithCount;
  }

  static async getPopularTags(limit: number = 10) {
    const result = await db
      .select({
        tagId: productToTags.tagId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(productToTags)
      .innerJoin(products, eq(productToTags.productId, products.id))
      .where(eq(products.isPublished, true))
      .groupBy(productToTags.tagId)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);

    const tagIds = result.map((r) => r.tagId);
    
    if (tagIds.length === 0) {
      return [];
    }

    const tags = await db.query.productTags.findMany({
      where: sql`${productTags.id} = ANY(${tagIds})`,
    });

    // Map tags with their counts
    return tags.map((tag) => {
      const countData = result.find((r) => r.tagId === tag.id);
      return {
        ...tag,
        productCount: countData?.count || 0,
      };
    });
  }
}
