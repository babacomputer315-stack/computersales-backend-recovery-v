import { Router } from "express";
import * as OrderController from "../../controllers/user/order.controller";
import { authenticateToken } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import {
  createOrderSchema,
  getOrderByIdSchema,
  cancelOrderSchema,
  getOrderStatusSchema,
  getUserOrdersSchema,
} from "../../validations/order.validation";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/user/orders
 * @desc Create a new order
 * @access Private
 */
router.post(
  "/",
  //   createOrderSchema,
  //   validateRequest,
  OrderController.createOrder
);

/**
 * @route GET /api/user/orders
 * @desc Get all orders for the authenticated user
 * @access Private
 */
router.get(
  "/",
  //   validateRequest(getUserOrdersSchema),
  OrderController.getUserOrders
);

/**
 * @route GET /api/user/orders/:id
 * @desc Get order by ID for the authenticated user
 * @access Private
 */
router.get(
  "/:id",
  //   validateRequest(getOrderByIdSchema),
  OrderController.getOrderById
);

/**
 * @route PUT /api/user/orders/:id/cancel
 * @desc Cancel an order (only if it's pending)
 * @access Private
 */
router.put(
  "/:id/cancel",
  //   validateRequest(cancelOrderSchema),
  OrderController.cancelOrder
);

/**
 * @route GET /api/user/orders/:id/status
 * @desc Get order status
 * @access Private
 */
router.get(
  "/:id/status",
  //   validateRequest(getOrderStatusSchema),
  OrderController.getOrderStatus
);

export default router;
