import { Request, Response } from "express";
import { AuditLogService } from "../../services/admin/auditLog.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";
import { getNumberOrUndefined, getString, isValidSortOrder } from "../../utils/filterFormatter";

export class AuditLogController {
  /**
   * Get all audit logs with pagination and filters
   */
  static async getAll(req: Request, res: Response) {
    try {
      const {
        userId,
        action,
        resourceType,
        resourceId,
        startDate,
        endDate,
        page,
        limit,
        sortOrder,
      } = req.query;

      const filters = {
        userId: getNumberOrUndefined(userId),
        action: getString(action),
        resourceType: getString(resourceType),
        resourceId: getString(resourceId),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: getNumberOrUndefined(page) || 1,
        limit: getNumberOrUndefined(limit) || 50,
        sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as "asc" | "desc") : "desc",
      };

      const result = await AuditLogService.getAll(filters);

      return successResponse(res, result.data, "", 200, result.pagination);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return errorResponse(res, "Failed to fetch audit logs", error);
    }
  }

  /**
   * Get a single audit log by ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      
      if (!id || isNaN(id)) {
        return errorResponse(res, "Invalid ID", null, 400);
      }

      const log = await AuditLogService.getById(id);

      if (!log) {
        return errorResponse(res, "Audit log not found", null, 404);
      }

      return successResponse(res, log);
    } catch (error) {
      console.error("Error fetching audit log:", error);
      return errorResponse(res, "Failed to fetch audit log", error);
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getByResource(req: Request, res: Response) {
    try {
      const { resourceType, resourceId } = req.params;

      if (!resourceType || !resourceId) {
        return errorResponse(res, "Resource type and ID are required", null, 400);
      }

      const logs = await AuditLogService.getByResource(resourceType, resourceId);

      return successResponse(res, logs);
    } catch (error) {
      console.error("Error fetching resource audit logs:", error);
      return errorResponse(res, "Failed to fetch resource audit logs", error);
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getByUser(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      const limit = Number(req.query.limit) || 100;

      if (!userId || isNaN(userId)) {
        return errorResponse(res, "Invalid user ID", null, 400);
      }

      const logs = await AuditLogService.getByUser(userId, limit);

      return successResponse(res, logs);
    } catch (error) {
      console.error("Error fetching user audit logs:", error);
      return errorResponse(res, "Failed to fetch user audit logs", error);
    }
  }
}

