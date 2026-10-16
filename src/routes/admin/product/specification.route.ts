import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from "../../../controllers/admin/product/specification.controller";
import validateRequest from "../../../middlewares/validateRequest";
// import { specificationValidation } from "../../../validations/admin/specification.validation";

const router = express.Router();

router.get("/", getAll);
router.get("/:id", getById);
router.post(
  "/",
  // validateRequest(specificationValidation.create),
  create
);
router.put(
  "/:id",
  //  validateRequest(specificationValidation.update),
  update
);
router.delete("/:id", remove);

export default router;
