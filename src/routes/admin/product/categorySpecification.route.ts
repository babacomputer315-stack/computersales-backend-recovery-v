import express from "express";
import {
  getCategorySpecifications,
  addSpecificationToCategory,
  removeSpecificationFromCategory,
  updateSpecificationOrder,
  updateCategorySpecification,
} from "../../../controllers/admin/product/categorySpecification.controller";
import validateRequest from "../../../middlewares/validateRequest";
// import { categorySpecificationValidation } from "../../../validations/admin/specification.validation";

const router = express.Router();

// router.get("/categories/:categoryId/specifications", getCategorySpecifications);
router.get("/:categoryId/specifications", getCategorySpecifications);
router.post(
  "/:categoryId/specifications",
  //   validateRequest(categorySpecificationValidation.add),
  addSpecificationToCategory
);
router.delete(
  "/:categoryId/specifications/:specificationId",
  removeSpecificationFromCategory
);
router.put(
  "/:categoryId/specifications/:specificationId/order",
  //   validateRequest(categorySpecificationValidation.updateOrder),
  updateSpecificationOrder
);
router.patch(
  "/:categoryId/specifications/:specificationId",
  //   validateRequest(categorySpecificationValidation.update),
  updateCategorySpecification
);

export default router;
