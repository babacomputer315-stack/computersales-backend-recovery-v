import { Router } from "express";
import * as StaticPageController from "../../controllers/admin/staticPage.controller";

const router = Router();

router.get("/", StaticPageController.getAll);
router.get("/:id", StaticPageController.getById);
router.post("/", StaticPageController.create);
router.put("/:id", StaticPageController.update);
router.delete("/:id", StaticPageController.remove);

export default router;
