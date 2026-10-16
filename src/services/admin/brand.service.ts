import { db } from "../../db/client";
import { brands, type Brand, type NewBrand } from "../../db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";

export interface BrandWithStats extends Brand {
  productCount: number;
}

export class BrandService {
  static async getAll(
    options: {
      page?: number;
      limit?: number;
      sortBy?: keyof Brand;
      sortOrder?: "asc" | "desc";
      filters?: {
        name?: string;
        isActive?: boolean;
        isFeatured?: boolean;
      };
    } = {}
  ) {
    const {
      page = 1,
      limit = 100,
      sortBy = "createdAt",
      sortOrder = "desc",
      filters = {},
    } = options;

    const whereClauses = [];

    if (filters.name) {
      whereClauses.push(ilike(brands.name, `%${filters.name}%`));
    }
    if (filters.isActive !== undefined) {
      whereClauses.push(eq(brands.isActive, filters.isActive));
    }
    if (filters.isFeatured !== undefined) {
      whereClauses.push(eq(brands.isFeatured, filters.isFeatured));
    }

    const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;
    const offset = (page - 1) * limit;

    const data = await db.query.brands.findMany({
      where,
      limit,
      offset,
      orderBy: (fields, { asc: ascFn, desc: descFn }) =>
        sortOrder === "asc"
          ? ascFn(fields[sortBy as keyof typeof fields])
          : descFn(fields[sortBy as keyof typeof fields]),
      with: {
        image: true,
      },
    });

    const total = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(brands)
      .where(where ?? sql`true`);

    return {
      data,
      pagination: {
        page,
        limit,
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit),
      },
    };
  }

  static async getById(id: number) {
    return await db.query.brands.findFirst({
      where: eq(brands.id, id),
      with: {
        image: true,
      },
    });
  }

  static async getBySlug(slug: string) {
    return await db.query.brands.findFirst({
      where: eq(brands.slug, slug),
      with: {
        image: true,
      },
    });
  }

  static async create(data: NewBrand) {
    const [result] = await db
      .insert(brands)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();

    return result;
  }

  static async update(id: number, data: Partial<NewBrand>) {
    const [result] = await db
      .update(brands)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(brands.id, id))
      .returning();

    return result;
  }

  static async delete(id: number) {
    const [result] = await db
      .delete(brands)
      .where(eq(brands.id, id))
      .returning();

    return result;
  }

  static async getWithStats(id: number): Promise<BrandWithStats | null> {
    const brand = await this.getById(id);
    if (!brand) return null;

    // Get product count for this brand
    // Note: This assumes products have a brandId field. If not, you might need to join through product specifications or other means
    const productCountResult = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(brands)
      .where(eq(brands.id, id));

    return {
      ...brand,
      productCount: productCountResult[0]?.count || 0,
    };
  }

  static async getFeaturedBrands() {
    return await db.query.brands.findMany({
      where: and(eq(brands.isFeatured, true), eq(brands.isActive, true)),
      orderBy: (fields, { asc }) => asc(fields.name),
      with: {
        image: true,
      },
    });
  }

  static async getActiveBrands() {
    return await db.query.brands.findMany({
      where: eq(brands.isActive, true),
      orderBy: (fields, { asc }) => asc(fields.name),
      with: {
        image: true,
      },
    });
  }

  static async bulkUpdateStatus(ids: number[], isActive: boolean) {
    const results = await db
      .update(brands)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(sql`${brands.id} = ANY(${ids})`)
      .returning();

    return results;
  }

  static async bulkUpdateFeatured(ids: number[], isFeatured: boolean) {
    const results = await db
      .update(brands)
      .set({
        isFeatured,
        updatedAt: new Date(),
      })
      .where(sql`${brands.id} = ANY(${ids})`)
      .returning();

    return results;
  }

  static async searchBrands(query: string, limit: number = 10) {
    return await db.query.brands.findMany({
      where: and(ilike(brands.name, `%${query}%`), eq(brands.isActive, true)),
      limit,
      orderBy: (fields, { asc }) => asc(fields.name),
      with: {
        image: true,
      },
    });
  }
}
