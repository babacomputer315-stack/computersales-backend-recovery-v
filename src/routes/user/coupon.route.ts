import { Router } from "express";
import { userCouponController } from "../../controllers/user/coupon.controller";
// import { validateRequest } from "../../middlewares/validateRequest";
import { applyCouponSchema } from "../../validations/coupon.validation";

const router = Router();

/**
 * @route POST /api/user/coupons/apply
 * @desc Apply coupon to cart items
 * @access User
 */
router.post(
  "/apply",
  //   validateRequest(applyCouponSchema),
  userCouponController.applyCoupon
);

/**
 * @route GET /api/user/coupons/:code
 * @desc Get coupon details by code
 * @access Public
 */
router.get("/:code", userCouponController.getCouponDetails);

export default router;
