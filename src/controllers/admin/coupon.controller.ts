import { Request, Response } from "express";
import { couponService } from "../../services/admin/coupon.service";
import {
  getNumberOrUndefined,
  getString,
  isValidSortBy,
  isValidSortOrder,
} from "../../utils/filterFormatter";
import { errorResponse, successResponse } from "../../utils/apiResponse";

export class CouponController {
  // Get all coupons with pagination and filters
  async getAllCoupons(req: Request, res: Response) {
    try {
      const { type, sortBy, sortOrder, page, limit, search, isActive } =
        req.query;

      const filters = {
        type: getString(type),
        sortBy: isValidSortBy(sortBy) ? (sortBy as any) : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as any) : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
        search: getString(search),
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
      };

      const coupons = await couponService.getCouponsWithUsageCount(filters);
      return successResponse(res, coupons.data, "", 200, coupons.meta);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      return errorResponse(res, "Failed to fetch coupons", error);
    }
  }

  // Get coupon by ID
  async getCouponById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return errorResponse(res, "Invalid coupon ID", null, 400);
      }

      const coupon = await couponService.getCouponById(id);

      if (!coupon) {
        return errorResponse(res, "Coupon not found", null, 404);
      }

      return successResponse(res, coupon, "Coupon retrieved successfully");
    } catch (error) {
      console.error("Error fetching coupon:", error);
      return errorResponse(res, "Failed to fetch coupon", error);
    }
  }

  // Create new coupon
  async createCoupon(req: Request, res: Response) {
    try {
      const {
        code,
        type,
        value,
        maxUsage,
        startDate,
        endDate,
        productId,
        categoryId,
        isActive,
      } = req.body;

      // Validate required fields
      if (!code || !type || value === undefined) {
        return errorResponse(
          res,
          "Code, type, and value are required",
          null,
          400
        );
      }

      // Check if coupon code already exists
      const existingCoupon = await couponService.getCouponByCode(code);
      if (existingCoupon) {
        return errorResponse(res, "Coupon code already exists", null, 400);
      }

      // Validate productId and categoryId are not both set
      if (productId && categoryId) {
        return errorResponse(
          res,
          "Cannot set both productId and categoryId",
          null,
          400
        );
      }

      // Validate percentage value
      if (type === "percentage" && (value < 1 || value > 100)) {
        return errorResponse(
          res,
          "Percentage value must be between 1 and 100",
          null,
          400
        );
      }

      // Validate dates
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        return errorResponse(
          res,
          "Start date must be before end date",
          null,
          400
        );
      }

      const coupon = await couponService.createCoupon({
        code,
        type,
        value,
        maxUsage,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        productId,
        categoryId,
        isActive,
      });

      return successResponse(res, coupon, "Coupon created successfully", 201);
    } catch (error) {
      console.error("Error creating coupon:", error);
      return errorResponse(res, "Failed to create coupon", error);
    }
  }

  // Update coupon
  async updateCoupon(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return errorResponse(res, "Invalid coupon ID", null, 400);
      }

      const {
        code,
        type,
        value,
        maxUsage,
        startDate,
        endDate,
        productId,
        categoryId,
        isActive,
      } = req.body;

      // Check if coupon exists
      const existingCoupon = await couponService.getCouponById(id);
      if (!existingCoupon) {
        return errorResponse(res, "Coupon not found", null, 404);
      }

      // If code is being updated, check if new code already exists
      if (code && code !== existingCoupon.code) {
        const codeExists = await couponService.getCouponByCode(code);
        if (codeExists) {
          return errorResponse(res, "Coupon code already exists", null, 400);
        }
      }

      // Validate productId and categoryId are not both set
      if (productId && categoryId) {
        return errorResponse(
          res,
          "Cannot set both productId and categoryId",
          null,
          400
        );
      }

      // Validate percentage value
      if (type === "percentage" && value && (value < 1 || value > 100)) {
        return errorResponse(
          res,
          "Percentage value must be between 1 and 100",
          null,
          400
        );
      }

      // Validate dates
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        return errorResponse(
          res,
          "Start date must be before end date",
          null,
          400
        );
      }

      const updateData: any = {};
      if (code !== undefined) updateData.code = code;
      if (type !== undefined) updateData.type = type;
      if (value !== undefined) updateData.value = value;
      if (maxUsage !== undefined) updateData.maxUsage = maxUsage;
      if (startDate !== undefined)
        updateData.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined)
        updateData.endDate = endDate ? new Date(endDate) : null;
      if (productId !== undefined) updateData.productId = productId;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (isActive !== undefined) updateData.isActive = isActive;

      const coupon = await couponService.updateCoupon(id, updateData);

      if (!coupon) {
        return errorResponse(res, "Failed to update coupon", null, 500);
      }

      return successResponse(res, coupon, "Coupon updated successfully");
    } catch (error) {
      console.error("Error updating coupon:", error);
      return errorResponse(res, "Failed to update coupon", error);
    }
  }

  // Delete coupon
  async deleteCoupon(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return errorResponse(res, "Invalid coupon ID", null, 400);
      }

      const coupon = await couponService.deleteCoupon(id);

      if (!coupon) {
        return errorResponse(res, "Coupon not found", null, 404);
      }

      return successResponse(
        res,
        { id: coupon.id },
        "Coupon deleted successfully"
      );
    } catch (error) {
      console.error("Error deleting coupon:", error);
      return errorResponse(res, "Failed to delete coupon", error);
    }
  }

  // Get coupon statistics
  async getCouponStats(req: Request, res: Response) {
    try {
      const stats = await couponService.getCouponStats();
      return successResponse(
        res,
        stats,
        "Coupon statistics retrieved successfully"
      );
    } catch (error) {
      console.error("Error fetching coupon statistics:", error);
      return errorResponse(res, "Failed to fetch coupon statistics", error);
    }
  }
}

export const couponController = new CouponController();
