import { Router } from "express";
import {
  getAllOrderNotes,
  getOrderNoteById,
  createOrderNote,
  updateOrderNote,
  deleteOrderNote,
} from "../../controllers/admin/orderNote.controller";

const router = Router();

router.get("/", getAllOrderNotes);
router.get("/:id", getOrderNoteById);
router.post("/", createOrderNote);
router.put("/:id", updateOrderNote);
router.delete("/:id", deleteOrderNote);

export default router;
