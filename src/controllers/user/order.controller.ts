import { Request, Response } from "express";
import { UserOrderService } from "../../services/user/order.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      items,
      shippingAddressId,
      paymentMethod,
      customerNote,
      shippingClassId,
      depositImageId,
      isAssembly,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, "Order items are required", null, 400);
    }

    if (!shippingAddressId) {
      return errorResponse(res, "Shipping address is required", null, 400);
    }

    const result = await UserOrderService.createOrder(userId, {
      items,
      shippingAddressId,
      paymentMethod,
      customerNote,
      shippingClassId,
      depositImageId,
      isAssembly,
    });

    return successResponse(res, result, "", 201);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page = "1", limit = "10", status = "pending" } = req.query;

    const result = await UserOrderService.getUserOrders(
      userId,
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      status as
        | "pending"
        | "processing"
        | "completed"
        | "cancelled"
        | "failed"
        | "returned"
    );

    return successResponse(
      res,
      {
        orders: result.orders,
        statusCounts: result.statusCounts,
      },
      "",
      200,
      result.pagination
    );
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, "Failed to fetch orders", err);
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const orderId = parseInt(req.params.id, 10);

    const order = await UserOrderService.getOrderById(userId, orderId);
    return successResponse(res, order);
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const orderId = parseInt(req.params.id, 10);

    const result = await UserOrderService.cancelOrder(userId, orderId);
    return successResponse(res, result, "Order cancelled successfully");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};

export const getOrderStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const orderId = parseInt(req.params.id, 10);

    const status = await UserOrderService.getOrderStatus(userId, orderId);
    return successResponse(res, status, "Order status retrieved successfully");
  } catch (err: any) {
    return errorResponse(res, err.message, err, err.statusCode ?? 500);
  }
};
