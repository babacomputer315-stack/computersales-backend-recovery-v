import { Router } from "express";
import * as ShippingClassesController from "../../controllers/admin/shippingClass.controller";

const router = Router();

router.get("/", ShippingClassesController.getAll);
router.get("/:id", ShippingClassesController.getById);
router.post("/", ShippingClassesController.create);
router.put("/:id", ShippingClassesController.update);
router.delete("/:id", ShippingClassesController.remove);

export default router;
