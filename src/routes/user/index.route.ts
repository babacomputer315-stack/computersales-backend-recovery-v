import { Router } from "express";
import productRoutes from "./product.route";
import categoryRoutes from "./category.route";
import tagRoutes from "./tag.route";
import orderRoutes from "./order.route";
import paymentRoutes from "./payment.route";
import addressRoutes from "./address.route";
import couponRoutes from "./coupon.route";
import brandsRoutes from "./brands.route";
import bannerRoutes from "./banner.route";
import categorySpecificationRoutes from "./categorySpecification.route";
import productCommentRoutes from "./productComment.route";
import shippingClassRoutes from "./shippingClass.route";
import filesRoute from "./files.route";
import blogRoutes from "./blog.route";

const router = Router();

// Product Routes
router.use("/products", productRoutes);
router.use("/products", productCommentRoutes);

// Category Routes
router.use("/categories", categoryRoutes);

// Tag Routes
router.use("/tags", tagRoutes);

// Order Routes
router.use("/orders", orderRoutes);

// Payment Routes
router.use("/payments", paymentRoutes);

// Address Routes
router.use("/addresses", addressRoutes);

// Coupon Routes
router.use("/coupons", couponRoutes);

// Brands Routes
router.use("/brands", brandsRoutes);

// Banner Routes
router.use("/banners", bannerRoutes);

// Category Specification Routes
router.use("/category-specifications", categorySpecificationRoutes);

// Shipping Class Routes
router.use("/shipping-classes", shippingClassRoutes);

// File Routes
router.use("/files", filesRoute);

// Blog Routes
router.use("/blog", blogRoutes);

export default router;
