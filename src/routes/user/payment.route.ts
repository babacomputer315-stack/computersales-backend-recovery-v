import { Router } from "express";
import * as PaymentController from "../../controllers/user/payment.controller";
import { authenticateToken } from "../../middlewares/auth";

const router = Router();

/**
 * @route GET /api/user/payments/providers
 * @desc Get available payment providers
 * @access Public
 */
router.get("/providers", PaymentController.getAvailableProviders);

/**
 * @route POST /api/user/payments/callback/zibal
 * @desc Handle Zibal payment gateway callback
 * @access Public (no authentication required - called by Zibal)
 */
router.post("/callback/zibal", PaymentController.handleZibalCallback);

/**
 * @route POST /api/user/payments/callback/pec
 * @desc Handle PEC (Parsian) payment gateway callback
 * @access Public (no authentication required - called by PEC)
 * @note PEC sends data via POST with form data after payment
 */
router.post("/callback/pec", PaymentController.handlePecCallback);

/**
 * @route GET /api/user/payments/callback/pec
 * @desc Handle PEC (Parsian) payment gateway callback (GET fallback)
 * @access Public (no authentication required)
 * @note Some browsers may redirect with GET, so we support both
 */
router.get("/callback/pec", PaymentController.handlePecCallback);

// Legacy callback endpoint for backwards compatibility
router.post("/callback", PaymentController.handleZibalCallback);

// Apply authentication middleware to protected routes
router.use(authenticateToken);

/**
 * @route GET /api/user/payments
 * @desc Get all payments for the authenticated user
 * @access Private
 */
router.get("/", PaymentController.getUserPayments);

/**
 * @route GET /api/user/payments/order/:orderId
 * @desc Get payment by order ID for the authenticated user
 * @access Private
 */
router.get("/order/:orderId", PaymentController.getPaymentByOrderId);

/**
 * @route POST /api/user/payments/order/:orderId/initiate
 * @desc Initiate payment for an order
 * @access Private
 * @body { provider?: "zibal" | "pec" } - Optional, defaults to "zibal"
 */
router.post("/order/:orderId/initiate", PaymentController.initiatePayment);

/**
 * @route POST /api/user/payments/order/:orderId/verify
 * @desc Verify payment for an order
 * @access Private
 * @body { trackingCode: string, provider: "zibal" | "pec" }
 */
router.post("/order/:orderId/verify", PaymentController.verifyPayment);

/**
 * @route GET /api/user/payments/order/:orderId/status
 * @desc Get payment status for an order
 * @access Private
 */
router.get("/order/:orderId/status", PaymentController.getPaymentStatus);

/**
 * @route POST /api/user/payments/order/:orderId/refund
 * @desc Request refund for a payment
 * @access Private
 */
router.post("/order/:orderId/refund", PaymentController.refundPayment);

export default router;
