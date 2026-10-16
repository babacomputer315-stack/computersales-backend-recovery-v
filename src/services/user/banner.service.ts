import { db } from "../../db/client";
import { banners, type Banner } from "../../db/schema";
import { eq, and, desc, asc, ilike, sql } from "drizzle-orm";

export class UserBannerService {
  static async getAll(
    options: {
      page?: number;
      limit?: number;
      sortBy?: keyof Banner;
      sortOrder?: "asc" | "desc";
      filters?: {
        name?: string;
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

    if (filters.name) {
      whereClauses.push(ilike(banners.name, `%${filters.name}%`));
    }

    const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;
    const offset = (page - 1) * limit;

    const data = await db.query.banners.findMany({
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
      .from(banners)
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
    return await db.query.banners.findFirst({
      where: eq(banners.id, id),
      with: {
        image: true,
      },
    });
  }

  static async getActiveBanners() {
    return await db.query.banners.findMany({
      orderBy: (fields, { desc }) => desc(fields.createdAt),
      with: {
        image: true,
      },
    });
  }

  static async searchBanners(query: string, limit: number = 10) {
    return await db.query.banners.findMany({
      where: ilike(banners.name, `%${query}%`),
      limit,
      orderBy: (fields, { asc }) => asc(fields.name),
      with: {
        image: true,
      },
    });
  }
}
