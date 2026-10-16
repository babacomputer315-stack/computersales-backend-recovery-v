import { Router } from "express";
import { UserShippingClassController } from "../../controllers/user/shippingClass.controller";

const router = Router();

// Get all shipping classes
router.get("/", UserShippingClassController.getAll);

// Get shipping class by ID
router.get("/:id", UserShippingClassController.getById);

export default router;

