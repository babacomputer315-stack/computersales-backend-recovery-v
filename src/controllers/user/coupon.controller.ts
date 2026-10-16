import { Request, Response } from "express";
import { userCouponService } from "../../services/user/coupon.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export class UserCouponController {
  // Apply coupon to cart items
  async applyCoupon(req: Request, res: Response) {
    try {
      const { code, items } = req.body;

      if (!code || !items || !Array.isArray(items) || items.length === 0) {
        return errorResponse(res, "Coupon code and items are required", null, 400);
      }

      // Validate items structure
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice) {
          return errorResponse(res, "Each item must have productId, quantity, and unitPrice", null, 400);
        }
      }

      const result = await userCouponService.applyCoupon(code, items);

      if (!result.valid) {
        return errorResponse(res, result.error, null, 400);
      }

      return successResponse(res, {
        coupon: result.coupon,
        discountAmount: result.discountAmount,
        applicableItems: result.applicableItems,
      }, "Coupon applied successfully");
    } catch (error) {
      console.error("Error applying coupon:", error);
      return errorResponse(res, "Failed to apply coupon", error);
    }
  }

  // Get coupon details
  async getCouponDetails(req: Request, res: Response) {
    try {
      const { code } = req.params;

      if (!code) {
        return errorResponse(res, "Coupon code is required", null, 400);
      }

      const coupon = await userCouponService.getCouponDetails(code);

      if (!coupon) {
        return errorResponse(res, "Coupon not found", null, 404);
      }

      return successResponse(res, coupon, "Coupon details retrieved successfully");
    } catch (error) {
      console.error("Error fetching coupon details:", error);
      return errorResponse(res, "Failed to fetch coupon details", error);
    }
  }
}

export const userCouponController = new UserCouponController();
