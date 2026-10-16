import express from "express";
import { specificationController } from "../../controllers/admin/specification.controller";

const router = express.Router();

// Specification Management
router.get("/", specificationController.getAllSpecifications);
router.get("/stats", specificationController.getSpecificationStats);
router.get("/:id", specificationController.getSpecification);
router.post("/", specificationController.createSpecification);
router.patch("/:id", specificationController.updateSpecification);
router.delete("/:id", specificationController.deleteSpecification);

// Specification Options Management
router.get("/:specificationId/options", specificationController.getSpecificationOptions);
router.post("/:specificationId/options", specificationController.createSpecificationOption);
router.patch("/options/:id", specificationController.updateSpecificationOption);
router.delete("/options/:id", specificationController.deleteSpecificationOption);

// Product Specifications Management
router.get("/product/:productId", specificationController.getProductSpecifications);
router.post("/product/:productId", specificationController.setProductSpecification);
router.delete("/product/:productId/:specificationId", specificationController.deleteProductSpecification);

// Category Specifications
router.get("/category/:categoryId", specificationController.getSpecificationsByCategory);

// Product Filtering
router.post("/filter", specificationController.filterProductsBySpecifications);

export default router;
