import express from "express";
import { orderController } from "../../controllers/admin/order.controller";

const router = express.Router();

// Create a new order
router.post("/", orderController.createOrder);

// Get all order
router.get("/", orderController.getAllOrders);

// Get order by ID
router.get("/:id", orderController.getOrder);

// Get orders by user ID
router.get("/user/:userId", orderController.getUserOrders);

// Update order status
router.patch("/:id/status", orderController.updateOrderStatus);

// Delete order
router.delete("/:id", orderController.deleteOrder);

// Update order item quantity
router.patch("/items/:itemId", orderController.updateOrderItem);

export default router;
