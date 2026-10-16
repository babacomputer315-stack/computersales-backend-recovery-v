import { db } from "../../db/client";
import { shippingClasses, type ShippingClass } from "../../db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";

export class UserShippingClassService {
  static async getAll(
    options: {
      page?: number;
      limit?: number;
      sortBy?: keyof ShippingClass;
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
      whereClauses.push(ilike(shippingClasses.name, `%${filters.name}%`));
    }

    const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;
    const offset = (page - 1) * limit;

    const data = await db.query.shippingClasses.findMany({
      where,
      limit,
      offset,
      orderBy: (fields, { asc: ascFn, desc: descFn }) =>
        sortOrder === "asc"
          ? ascFn(fields[sortBy as keyof typeof fields])
          : descFn(fields[sortBy as keyof typeof fields]),
    });

    const total = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(shippingClasses)
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
    return await db.query.shippingClasses.findFirst({
      where: eq(shippingClasses.id, id),
    });
  }
}

