import { Request, Response } from "express";
import { orderService } from "../../services/admin/order.service";
import {
  getNumberOrUndefined,
  getString,
  isValidSortBy,
  isValidSortOrder,
} from "../../utils/filterFormatter";
import { errorResponse, successResponse } from "../../utils/apiResponse";

export class OrderController {
  async getAllOrders(req: Request, res: Response) {
    try {
      const {
        status,
        sortBy,
        sortOrder,
        page,
        limit,
        name: nameQuery,
        userId,
        shippingClass,
        shippingClassId,
      } = req.query;

      const rawName = getString(nameQuery);
      const searchName = rawName?.trim() || undefined;

      const filters = {
        status: getString(status),
        sortBy: isValidSortBy(sortBy) ? (sortBy as any) : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as any) : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
        name: searchName,
        userId: getNumberOrUndefined(userId),
        shippingClassId: getNumberOrUndefined(
          shippingClassId ?? shippingClass
        ),
      };

      const orders = await orderService.getPaginatedOrders(filters);

      res.json(orders);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  }

  async createOrder(req: Request, res: Response) {
    try {
      const { orderData, items } = req.body;

      // Validate input
      if (!orderData || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid order data" });
      }

      const order = await orderService.createOrder(orderData, items);
      return successResponse(res, order);
    } catch (error) {
      console.error("Error creating order:", error);
      return errorResponse(res);
    }
  }

  async getOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(Number(id));

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      return successResponse(res, order);
    } catch (error) {
      console.error("Error fetching order:", error);
      return errorResponse(res);
    }
  }

  async getUserOrders(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const orders = await orderService.getOrdersByUserId(Number(userId));
      return successResponse(res, orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ error: "Failed to fetch user orders" });
    }
  }

  async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedOrder = await orderService.updateOrderStatus(
        Number(id),
        status
      );

      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      return successResponse(res, updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      return errorResponse(res);
    }
  }

  async deleteOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await orderService.deleteOrder(Number(id));

      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  }

  async updateOrderItem(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (!quantity || typeof quantity !== "number") {
        return res.status(400).json({ error: "Valid quantity is required" });
      }

      const updatedItem = await orderService.updateOrderItemQuantity(
        Number(itemId),
        quantity
      );

      if (!updatedItem) {
        return res.status(404).json({ error: "Order item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating order item:", error);
      res.status(500).json({ error: "Failed to update order item" });
    }
  }
}

export const orderController = new OrderController();
