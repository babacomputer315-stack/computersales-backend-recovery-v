import { Router } from "express";
import { AuditLogController } from "../../controllers/admin/auditLog.controller";
import { requireSuperAdmin } from "../../middlewares/auth";

const router = Router();

// All audit log routes require super_admin role for security
router.use(requireSuperAdmin);

// Get all audit logs with filters
router.get("/", AuditLogController.getAll);

// Get audit log by ID
router.get("/:id", AuditLogController.getById);

// Get audit logs for a specific resource
router.get("/resource/:resourceType/:resourceId", AuditLogController.getByResource);

// Get audit logs for a specific user
router.get("/user/:userId", AuditLogController.getByUser);

export default router;

