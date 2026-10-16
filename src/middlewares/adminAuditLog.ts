import { Request, Response, NextFunction } from "express";
import { AuditLogService } from "../services/admin/auditLog.service";
import { NewAdminAuditLog } from "../db/schema/adminAuditLogs";

// Map route patterns to resource types
const ROUTE_TO_RESOURCE: Record<string, string> = {
  "/products": "product",
  "/product_comments": "product_comment",
  "/product_categories": "product_category",
  "/product_tags": "product_tag",
  "/attributes": "attribute",
  "/attribute_values": "attribute_value",
  "/product_specifications": "product_specification",
  "/category_specifications": "category_specification",
  "/static_pages": "static_page",
  "/shipping_classes": "shipping_class",
  "/users": "user",
  "/files": "file",
  "/orders": "order",
  "/order_notes": "order_note",
  "/addresses": "address",
  "/payments": "payment",
  "/specifications": "specification",
  "/blog_posts": "blog_post",
  "/blog_categories": "blog_category",
  "/blog_tags": "blog_tag",
  "/blog_comments": "blog_comment",
  "/coupons": "coupon",
  "/brands": "brand",
  "/banners": "banner",
};

/**
 * Extract resource type from the route path
 */
function getResourceType(path: string): string {
  // Remove /api/admin prefix if present
  const cleanPath = path.replace(/^\/api\/admin/, "");
  
  // Find matching resource
  for (const [route, resource] of Object.entries(ROUTE_TO_RESOURCE)) {
    if (cleanPath.startsWith(route)) {
      return resource;
    }
  }
  
  // Fallback: extract from path
  const parts = cleanPath.split("/").filter(Boolean);
  return parts[0] || "unknown";
}

/**
 * Extract resource ID from the route path
 */
function getResourceId(path: string, params: Record<string, string>): string | null {
  // Try to get ID from route params
  if (params.id) return params.id;
  if (params.itemId) return params.itemId;
  
  // Try to extract from path
  const parts = path.split("/").filter(Boolean);
  const lastPart = parts[parts.length - 1];
  
  // Check if last part is a number (likely an ID)
  if (lastPart && /^\d+$/.test(lastPart)) {
    return lastPart;
  }
  
  return null;
}

/**
 * Determine the action type based on HTTP method and path
 */
function getActionType(
  method: string,
  path: string,
  body: any
): "create" | "update" | "delete" | "bulk_update" | "bulk_delete" {
  const lowerPath = path.toLowerCase();
  
  // Check for bulk operations
  if (lowerPath.includes("/bulk")) {
    if (method === "DELETE") return "bulk_delete";
    return "bulk_update";
  }
  
  // Check if body contains array of IDs (bulk operation)
  if (body && Array.isArray(body.ids)) {
    if (method === "DELETE") return "bulk_delete";
    return "bulk_update";
  }
  
  switch (method) {
    case "POST":
      return "create";
    case "PUT":
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return "update";
  }
}

/**
 * Extract resource name from request body or response data
 */
function getResourceName(body: any, responseData: any): string | null {
  // Try to get name from response data first
  if (responseData) {
    if (responseData.name) return responseData.name;
    if (responseData.title) return responseData.title;
    if (responseData.slug) return responseData.slug;
  }
  
  // Try to get name from request body
  if (body) {
    if (body.name) return body.name;
    if (body.title) return body.title;
    if (body.slug) return body.slug;
  }
  
  return null;
}

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

/**
 * Sanitize request body to remove sensitive data before logging
 */
function sanitizeBody(body: any): any {
  if (!body) return null;
  
  const sensitiveFields = ["password", "token", "secret", "code", "otp"];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }
  
  return sanitized;
}

/**
 * Middleware to log admin edit and delete operations
 * Should be applied after authentication middleware
 */
export const adminAuditLog = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const method = req.method.toUpperCase();
  
  // Only log POST, PUT, PATCH, DELETE methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return next();
  }
  
  const user = (req as any).user;
  
  // Skip if no user (shouldn't happen in admin routes, but just in case)
  if (!user || !user.id) {
    return next();
  }
  
  // Store the original JSON method to intercept the response
  const originalJson = res.json.bind(res);
  
  res.json = function (data: any) {
    // Log after successful response
    if (res.statusCode >= 200 && res.statusCode < 400) {
      const resourceType = getResourceType(req.originalUrl || req.path);
      const resourceId = getResourceId(req.path, req.params);
      const action = getActionType(method, req.path, req.body);
      
      // Extract response data for resource name
      const responseData = data?.data || data;
      
      const logData: NewAdminAuditLog = {
        userId: user.id,
        action,
        resourceType,
        resourceId,
        resourceName: getResourceName(req.body, responseData),
        route: req.originalUrl || req.path,
        method,
        requestBody: sanitizeBody(req.body),
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || null,
      };
      
      // Log asynchronously - don't wait for it
      AuditLogService.create(logData).catch((err) => {
        console.error("Failed to create audit log:", err);
      });
    }
    
    return originalJson(data);
  };
  
  next();
};

/**
 * Middleware to log with previous data (for updates/deletes)
 * Use this when you need to capture the previous state of the resource
 */
export const adminAuditLogWithPrevious = (
  fetchPreviousData: (req: Request) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    
    // Only log PUT, PATCH, DELETE methods
    if (!["PUT", "PATCH", "DELETE"].includes(method)) {
      return next();
    }
    
    const user = (req as any).user;
    
    if (!user || !user.id) {
      return next();
    }
    
    // Fetch previous data before the operation
    let previousData = null;
    try {
      previousData = await fetchPreviousData(req);
    } catch (err) {
      console.error("Failed to fetch previous data for audit log:", err);
    }
    
    // Store previous data in request for use in response handler
    (req as any).__auditPreviousData = previousData;
    
    const originalJson = res.json.bind(res);
    
    res.json = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const resourceType = getResourceType(req.originalUrl || req.path);
        const resourceId = getResourceId(req.path, req.params);
        const action = getActionType(method, req.path, req.body);
        const responseData = data?.data || data;
        
        const logData: NewAdminAuditLog = {
          userId: user.id,
          action,
          resourceType,
          resourceId,
          resourceName: getResourceName(req.body, responseData) || getResourceName(null, previousData),
          route: req.originalUrl || req.path,
          method,
          requestBody: sanitizeBody(req.body),
          previousData: previousData,
          ipAddress: getClientIp(req),
          userAgent: req.headers["user-agent"] || null,
        };
        
        AuditLogService.create(logData).catch((err) => {
          console.error("Failed to create audit log:", err);
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

