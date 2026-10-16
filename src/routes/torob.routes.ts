import { Router } from "express";
import * as TorobController from "../controllers/torob.controller";

const router = Router();

router.get("/", TorobController.getAllProducts);
router.post("/", TorobController.getAllProducts);

export default router;
