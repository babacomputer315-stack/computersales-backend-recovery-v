import { Router } from "express";
import { couponController } from "../../controllers/admin/coupon.controller";
// import { validateRequest } from "../../middlewares/validateRequest";
// import {
//   createCouponSchema,
//   updateCouponSchema,
//   getCouponByIdSchema,
//   deleteCouponSchema,
//   getCouponsSchema,
// } from "../../validations/coupon.validation";

const router = Router();

/**
 * @route GET /api/admin/coupons
 * @desc Get all coupons with pagination and filters
 * @access Admin
 */
router.get(
  "/",
  // validateRequest(getCouponsSchema),
  couponController.getAllCoupons
);

/**
 * @route GET /api/admin/coupons/stats
 * @desc Get coupon statistics
 * @access Admin
 */
router.get("/stats", couponController.getCouponStats);

/**
 * @route GET /api/admin/coupons/:id
 * @desc Get coupon by ID
 * @access Admin
 */
router.get(
  "/:id",
  //   validateRequest(getCouponByIdSchema),
  couponController.getCouponById
);

/**
 * @route POST /api/admin/coupons
 * @desc Create new coupon
 * @access Admin
 */
router.post(
  "/",
  //   validateRequest(createCouponSchema),
  couponController.createCoupon
);

/**
 * @route PUT /api/admin/coupons/:id
 * @desc Update coupon
 * @access Admin
 */
router.put(
  "/:id",
  //   validateRequest(updateCouponSchema),
  couponController.updateCoupon
);

/**
 * @route DELETE /api/admin/coupons/:id
 * @desc Delete coupon
 * @access Admin
 */
router.delete(
  "/:id",
  //   validateRequest(deleteCouponSchema),
  couponController.deleteCoupon
);

export default router;
