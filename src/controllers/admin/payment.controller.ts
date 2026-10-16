import { Request, Response } from "express";
import { paymentService } from "../../services/admin/payment.service";
import {
  getNumberOrUndefined,
  getString,
  isValidSortBy,
  isValidSortOrder,
} from "../../utils/filterFormatter";
import { errorResponse, successResponse } from "../../utils/apiResponse";

export class PaymentController {
  async getAllPayments(req: Request, res: Response) {
    try {
      const { 
        status, 
        provider, 
        sortBy, 
        sortOrder, 
        page, 
        limit,
        startDate,
        endDate,
        orderId,
        userId
      } = req.query;

      const filters = {
        status: getString(status),
        provider: getString(provider),
        sortBy: isValidSortBy(sortBy) ? (sortBy as any) : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as any) : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        orderId: getNumberOrUndefined(orderId),
        userId: getNumberOrUndefined(userId),
      };

      const payments = await paymentService.getPaginatedPayments(filters);

      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  }

  async getPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentWithDetails(Number(id));

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      return successResponse(res, payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      return errorResponse(res);
    }
  }

  async getPaymentsByOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const payments = await paymentService.getPaymentsByOrderId(Number(orderId));
      return successResponse(res, payments);
    } catch (error) {
      console.error("Error fetching order payments:", error);
      return errorResponse(res);
    }
  }

  async getPaymentsByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      const payments = await paymentService.getPaymentsByStatus(status);
      return successResponse(res, payments);
    } catch (error) {
      console.error("Error fetching payments by status:", error);
      return errorResponse(res);
    }
  }

  async getPaymentsByProvider(req: Request, res: Response) {
    try {
      const { provider } = req.params;
      const payments = await paymentService.getPaymentsByProvider(provider);
      return successResponse(res, payments);
    } catch (error) {
      console.error("Error fetching payments by provider:", error);
      return errorResponse(res);
    }
  }

  async getPaymentsByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }

      const payments = await paymentService.getPaymentsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      return successResponse(res, payments);
    } catch (error) {
      console.error("Error fetching payments by date range:", error);
      return errorResponse(res);
    }
  }

  async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const validStatuses = ["pending", "paid", "failed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updatedPayment = await paymentService.updatePaymentStatus(
        Number(id),
        status
      );

      if (!updatedPayment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      return successResponse(res, updatedPayment);
    } catch (error) {
      console.error("Error updating payment status:", error);
      return errorResponse(res);
    }
  }

  async updatePayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      const { id: _, createdAt, updatedAt, ...allowedFields } = updateData;

      const updatedPayment = await paymentService.updatePayment(
        Number(id),
        allowedFields
      );

      if (!updatedPayment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      return successResponse(res, updatedPayment);
    } catch (error) {
      console.error("Error updating payment:", error);
      return errorResponse(res);
    }
  }

  async deletePayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const payment = await paymentService.getPaymentById(Number(id));
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      await paymentService.deletePayment(Number(id));
      return successResponse(res, { message: "Payment deleted successfully" });
    } catch (error) {
      console.error("Error deleting payment:", error);
      return errorResponse(res);
    }
  }

  async getPaymentStats(req: Request, res: Response) {
    try {
      const stats = await paymentService.getPaymentStats();
      return successResponse(res, stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      return errorResponse(res);
    }
  }
}

export const paymentController = new PaymentController();
