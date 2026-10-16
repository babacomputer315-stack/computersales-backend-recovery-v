import { Router } from "express";
import * as controller from "../../../controllers/admin/product/productComment.controller";
import { authenticateToken, requireAdmin } from "../../../middlewares/auth";

const router = Router();

// router.use(authenticateToken, requireAdmin);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

router.get("/user/:userId", controller.getUserComments);

router.post("/:id/approve", controller.approve);
router.post("/:id/reject", controller.reject);
router.post("/:id/answer", controller.answer);

export default router;
