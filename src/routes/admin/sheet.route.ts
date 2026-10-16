import { Router } from "express";
import * as SheetController from "../../controllers/admin/sheet.controller";

const router = Router();

// Get all products
router.get("/products", SheetController.getAllProducts);
// Update product price and stock
router.post("/update-product", SheetController.updateProduct);
export default router;
