import { couponService } from "../admin/coupon.service";

export class UserCouponService {
  // Apply coupon to cart items
  async applyCoupon(code: string, items: Array<{
    productId: number;
    categoryId?: number;
    quantity: number;
    unitPrice: number;
  }>) {
    return await couponService.validateCoupon(code, items);
  }

  // Get coupon details (for display purposes)
  async getCouponDetails(code: string) {
    const coupon = await couponService.getCouponByCode(code);
    
    if (!coupon) {
      return null;
    }

    // Return only public information
    return {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      productId: coupon.productId,
      categoryId: coupon.categoryId,
      product: coupon.product,
      category: coupon.category,
    };
  }
}

export const userCouponService = new UserCouponService();
