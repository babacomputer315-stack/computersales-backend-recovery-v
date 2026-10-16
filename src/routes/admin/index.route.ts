import { Router } from "express";
import productRoutes from "./product/product.route";
import productCategoryRoutes from "./product/productCategories.route";
import productTagRoutes from "./product/productTags.route";
import attributesRoutes from "./product/attributes.route";
import attributeValueRoutes from "./product/attributeValues.route";
import specificationRoutes from "./product/specification.route";
import productSpecificationRoutes from "./product/productSpecification.route";
import categorySpecificationRoutes from "./product/categorySpecification.route";
import staticPageRoutes from "./staticPages.route";
import shippingClassesRoutes from "./shippingClasses.route";
import fileRoutes from "./files.route";
import ordersRoutes from "./orders.route";
import orderNoteRoutes from "./orderNote.routes";
import userRoutes from "./user.route";
import blogPostsRoutes from "./blog/blogPost.routes";
import blogCommentsRoutes from "./blog/blogComment.routes";
import blogCategoriesRoutes from "./blog/blogCategory.routes";
import blogTagsRoutes from "./blog/blogTag.routes";
import addressesRoutes from "./address.routes";
import paymentsRoutes from "./payments.route";
import specificationsRoutes from "./specifications.route";
import couponsRoutes from "./coupons.route";
import brandsRoutes from "./brands.route";
import bannerRoutes from "./banners.route";
import productCommentRoutes from "./product/productComment.route";
import sheetRoutes from "./sheet.route";
import auditLogsRoutes from "./auditLogs.route";
import { authenticateToken, requireAdmin } from "../../middlewares/auth";
import { adminAuditLog } from "../../middlewares/adminAuditLog";

const router = Router();

// Sheet Routes
router.use("/sheets", sheetRoutes);

router.use(authenticateToken);
router.use(requireAdmin);

// Admin Audit Log Middleware - logs all edit and delete operations
router.use(adminAuditLog);

// Audit Logs Routes (only accessible by super_admin)
router.use("/audit_logs", auditLogsRoutes);

// Product Routes
router.use("/products", productRoutes);
router.use("/product_comments", productCommentRoutes);
router.use("/product_categories", productCategoryRoutes);
router.use("/product_tags", productTagRoutes);
router.use("/attributes", attributesRoutes);
router.use("/attribute_values", attributeValueRoutes);
// router.use("/specifications", specificationRoutes);
router.use("/product_specifications", productSpecificationRoutes);
router.use("/category_specifications", categorySpecificationRoutes);

// Static Pages Routes
router.use("/static_pages", staticPageRoutes);

// Shipping Classes Routes
router.use("/shipping_classes", shippingClassesRoutes);

router.use("/users", userRoutes);

// File Routes
router.use("/files", fileRoutes);

// Orders Routes
router.use("/orders", ordersRoutes);

// OrderNotes Routes
router.use("/order_notes", orderNoteRoutes);

// Address Routes
router.use("/addresses", addressesRoutes);

// Payments Routes
router.use("/payments", paymentsRoutes);

// Specifications Routes
router.use("/specifications", specificationsRoutes);

// Blog Routes
router.use("/blog_posts", blogPostsRoutes);
router.use("/blog_categories", blogCategoriesRoutes);
router.use("/blog_tags", blogTagsRoutes);
router.use("/blog_comments", blogCommentsRoutes);

// Coupons Routes
router.use("/coupons", couponsRoutes);

// Brands Routes
router.use("/brands", brandsRoutes);

// Banner Routes
router.use("/banners", bannerRoutes);

export default router;
