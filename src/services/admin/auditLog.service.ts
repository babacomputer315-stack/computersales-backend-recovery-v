import { db } from "../../db/client";
import { adminAuditLogs, NewAdminAuditLog } from "../../db/schema/adminAuditLogs";
import { users } from "../../db/schema/users";
import { eq, desc, and, gte, lte, sql, ilike } from "drizzle-orm";

export interface AuditLogFilters {
  userId?: number;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class AuditLogService {
  /**
   * Create a new audit log entry
   */
  static async create(data: NewAdminAuditLog) {
    try {
      const [log] = await db.insert(adminAuditLogs).values(data).returning();
      return log;
    } catch (error) {
      console.error("Error creating audit log:", error);
      // Don't throw - audit logging should not break the main operation
      return null;
    }
  }

  /**
   * Get paginated audit logs with filters
   */
  static async getAll(filters: AuditLogFilters = {}) {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortOrder = "desc",
    } = filters;

    const conditions = [];

    if (userId) {
      conditions.push(eq(adminAuditLogs.userId, userId));
    }

    if (action) {
      conditions.push(eq(adminAuditLogs.action, action as any));
    }

    if (resourceType) {
      conditions.push(ilike(adminAuditLogs.resourceType, `%${resourceType}%`));
    }

    if (resourceId) {
      conditions.push(eq(adminAuditLogs.resourceId, resourceId));
    }

    if (startDate) {
      conditions.push(gte(adminAuditLogs.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(adminAuditLogs.createdAt, endDate));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (page - 1) * limit;

    const data = await db
      .select({
        id: adminAuditLogs.id,
        userId: adminAuditLogs.userId,
        userName: users.name,
        userMobile: users.mobile,
        action: adminAuditLogs.action,
        resourceType: adminAuditLogs.resourceType,
        resourceId: adminAuditLogs.resourceId,
        resourceName: adminAuditLogs.resourceName,
        route: adminAuditLogs.route,
        method: adminAuditLogs.method,
        requestBody: adminAuditLogs.requestBody,
        previousData: adminAuditLogs.previousData,
        ipAddress: adminAuditLogs.ipAddress,
        userAgent: adminAuditLogs.userAgent,
        createdAt: adminAuditLogs.createdAt,
      })
      .from(adminAuditLogs)
      .leftJoin(users, eq(adminAuditLogs.userId, users.id))
      .where(where)
      .orderBy(sortOrder === "desc" ? desc(adminAuditLogs.createdAt) : adminAuditLogs.createdAt)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(adminAuditLogs)
      .where(where);

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get audit log by ID
   */
  static async getById(id: number) {
    const [log] = await db
      .select({
        id: adminAuditLogs.id,
        userId: adminAuditLogs.userId,
        userName: users.name,
        userMobile: users.mobile,
        action: adminAuditLogs.action,
        resourceType: adminAuditLogs.resourceType,
        resourceId: adminAuditLogs.resourceId,
        resourceName: adminAuditLogs.resourceName,
        route: adminAuditLogs.route,
        method: adminAuditLogs.method,
        requestBody: adminAuditLogs.requestBody,
        previousData: adminAuditLogs.previousData,
        ipAddress: adminAuditLogs.ipAddress,
        userAgent: adminAuditLogs.userAgent,
        createdAt: adminAuditLogs.createdAt,
      })
      .from(adminAuditLogs)
      .leftJoin(users, eq(adminAuditLogs.userId, users.id))
      .where(eq(adminAuditLogs.id, id));

    return log || null;
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getByResource(resourceType: string, resourceId: string) {
    return db
      .select({
        id: adminAuditLogs.id,
        userId: adminAuditLogs.userId,
        userName: users.name,
        action: adminAuditLogs.action,
        resourceType: adminAuditLogs.resourceType,
        resourceId: adminAuditLogs.resourceId,
        resourceName: adminAuditLogs.resourceName,
        route: adminAuditLogs.route,
        method: adminAuditLogs.method,
        requestBody: adminAuditLogs.requestBody,
        previousData: adminAuditLogs.previousData,
        createdAt: adminAuditLogs.createdAt,
      })
      .from(adminAuditLogs)
      .leftJoin(users, eq(adminAuditLogs.userId, users.id))
      .where(
        and(
          eq(adminAuditLogs.resourceType, resourceType),
          eq(adminAuditLogs.resourceId, resourceId)
        )
      )
      .orderBy(desc(adminAuditLogs.createdAt));
  }

  /**
   * Get audit logs for a specific user
   */
  static async getByUser(userId: number, limit = 100) {
    return db
      .select({
        id: adminAuditLogs.id,
        action: adminAuditLogs.action,
        resourceType: adminAuditLogs.resourceType,
        resourceId: adminAuditLogs.resourceId,
        resourceName: adminAuditLogs.resourceName,
        route: adminAuditLogs.route,
        method: adminAuditLogs.method,
        createdAt: adminAuditLogs.createdAt,
      })
      .from(adminAuditLogs)
      .where(eq(adminAuditLogs.userId, userId))
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(limit);
  }

  /**
   * Delete old audit logs (for maintenance)
   */
  static async deleteOldLogs(beforeDate: Date) {
    return db
      .delete(adminAuditLogs)
      .where(lte(adminAuditLogs.createdAt, beforeDate));
  }
}

