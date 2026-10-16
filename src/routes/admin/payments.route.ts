import express from "express";
import { paymentController } from "../../controllers/admin/payment.controller";

const router = express.Router();

// Get all payments with filters
router.get("/", paymentController.getAllPayments);

// Get payment statistics
router.get("/stats", paymentController.getPaymentStats);

// Get payments by date range
router.get("/date-range", paymentController.getPaymentsByDateRange);

// Get payment by ID with full details
router.get("/:id", paymentController.getPayment);

// Get payments by order ID
router.get("/order/:orderId", paymentController.getPaymentsByOrder);

// Get payments by status
router.get("/status/:status", paymentController.getPaymentsByStatus);

// Get payments by provider
router.get("/provider/:provider", paymentController.getPaymentsByProvider);

// Update payment status
router.patch("/:id/status", paymentController.updatePaymentStatus);

// Update payment details
router.patch("/:id", paymentController.updatePayment);

// Delete payment
router.delete("/:id", paymentController.deletePayment);

export default router;
