import { Router } from "express";
import * as EmallsController from "../controllers/emalls.controller";

const router = Router();

router.get("/", EmallsController.getAllProducts);
router.post("/", EmallsController.getAllProducts);

export default router;
