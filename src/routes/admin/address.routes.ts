import { Router } from "express";
import * as addressController from "../../controllers/admin/address.controller";

const router = Router();

router.get("/", addressController.getAll);
router.get("/:id", addressController.getById);
router.post("/", addressController.create);
router.put("/:id", addressController.update);
router.delete("/:id", addressController.remove);

export default router;
