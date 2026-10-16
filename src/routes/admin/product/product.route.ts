import { Router } from "express";
import * as ProductController from "../../../controllers/admin/product/product.controller";

const router = Router();

router.get("/", ProductController.getAllProducts);
router.get("/:id", ProductController.getProductById);
router.post("/", ProductController.createProduct);
router.put("/:id", ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);
router.post("/:id/duplicate", ProductController.duplicateProduct);

export default router;
