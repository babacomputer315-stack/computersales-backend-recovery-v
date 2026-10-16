import { Router } from "express";
import * as CategoryController from "../../../controllers/admin/product/productCategories.controller";
import validateRequest from "../../../middlewares/validateRequest";
import { createCategoryValidation } from "../../../validations/category.validation";

const router = Router();

router.get("/", CategoryController.getAll);
router.get("/:id", CategoryController.getById);
router.post(
  "/",
  createCategoryValidation,
  validateRequest,
  CategoryController.create
);
router.put("/:id", CategoryController.update);
router.delete("/:id", CategoryController.remove);

export default router;
