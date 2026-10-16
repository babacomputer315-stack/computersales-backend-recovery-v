import express from "express";
import {
  getProductSpecifications,
  setProductSpecifications,
} from "../../../controllers/admin/product/productSpecification.controller";
import validateRequest from "../../../middlewares/validateRequest";
// import { productSpecificationValidation } from "../../../validations/admin/specification.validation";

const router = express.Router();

// router.get("/products/:productId/specifications", getProductSpecifications);
router.get("/:productId/specifications", getProductSpecifications);
router.put("/:productId/specifications", setProductSpecifications);

export default router;
