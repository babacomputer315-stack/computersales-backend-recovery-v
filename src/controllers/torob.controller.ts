import { Request, Response } from "express";
import { TorobService } from "../services/torob.service";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { page = "1", item_per_page = "100" } = req.query;

    const { data, pagination } = await TorobService.getAll({
      page: Number(page || 1),
      limit: Number(item_per_page || 100),
    });

    return res.json({
      success: true,
      products: data,
      total_items: pagination.total,
      pages_count: pagination.pages,
      item_per_page: pagination.limit,
      page_num: pagination.page,
    });
  } catch (err: any) {
    console.error(err);
    return res.json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};
