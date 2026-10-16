import { Router } from "express";
import * as AttributeValuesController from "../../../controllers/admin/product/attributeValues.controller";

const router = Router();

router.get("/", AttributeValuesController.getAll);
router.get("/:id", AttributeValuesController.getById);
router.post("/", AttributeValuesController.create);
router.put("/:id", AttributeValuesController.update);
router.delete("/:id", AttributeValuesController.remove);

export default router;
