import { db } from "../../db/client";
import { brands, type Brand } from "../../db/schema";
import { eq, and, desc, asc, ilike, sql } from "drizzle-orm";

export class UserBrandService {
  static async getAll(options: {
    page?: number;
    limit?: number;
    sortBy?: keyof Brand;
    sortOrder?: "asc" | "desc";
    filters?: {
      name?: string;
      isFeatured?: boolean;
    };
  } = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "name",
      sortOrder = "asc",
      filters = {},
    } = options;

    const whereClauses = [eq(brands.isActive, true)]; // Only active brands for users
    
    if (filters.name) {
      whereClauses.push(ilike(brands.name, `%${filters.name}%`));
    }
    if (filters.isFeatured !== undefined) {
      whereClauses.push(eq(brands.isFeatured, filters.isFeatured));
    }

    const where = and(...whereClauses);
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
      .where(where);

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
      where: and(
        eq(brands.id, id),
        eq(brands.isActive, true)
      ),
      with: {
        image: true,
      },
    });
  }

  static async getBySlug(slug: string) {
    return await db.query.brands.findFirst({
      where: and(
        eq(brands.slug, slug),
        eq(brands.isActive, true)
      ),
      with: {
        image: true,
      },
    });
  }

  static async getFeaturedBrands() {
    return await db.query.brands.findMany({
      where: and(
        eq(brands.isFeatured, true),
        eq(brands.isActive, true)
      ),
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

  static async searchBrands(query: string, limit: number = 10) {
    return await db.query.brands.findMany({
      where: and(
        ilike(brands.name, `%${query}%`),
        eq(brands.isActive, true)
      ),
      limit,
      orderBy: (fields, { asc }) => asc(fields.name),
      with: {
        image: true,
      },
    });
  }

  static async getBrandsWithProductCount() {
    // This would need to be implemented based on how products are linked to brands
    // For now, returning basic brand info
    return await db.query.brands.findMany({
      where: eq(brands.isActive, true),
      orderBy: (fields, { asc }) => asc(fields.name),
      with: {
        image: true,
      },
    });
  }
}

