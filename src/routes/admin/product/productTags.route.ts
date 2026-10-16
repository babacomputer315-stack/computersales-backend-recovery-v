import { Router } from "express";
import * as TagController from "../../../controllers/admin/product/productTags.controller";
import validateRequest from "../../../middlewares/validateRequest";
import { createTagValidation } from "../../../validations/tag.validation";

const router = Router();

router.get("/", TagController.getAll);
router.get("/:id", TagController.getById);
router.post("/", createTagValidation, validateRequest, TagController.create);
router.put("/:id", TagController.update);
router.delete("/:id", TagController.remove);

export default router;
