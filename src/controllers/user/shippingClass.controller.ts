import { Request, Response } from "express";
import { UserShippingClassService } from "../../services/user/shippingClass.service";

export class UserShippingClassController {
  static async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
        name,
      } = req.query;

      const result = await UserShippingClassService.getAll({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as "asc" | "desc",
        filters: {
          name: name as string,
        },
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error fetching shipping classes:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch shipping classes",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const shippingClass = await UserShippingClassService.getById(
        parseInt(id)
      );

      if (!shippingClass) {
        return res.status(404).json({
          success: false,
          message: "Shipping class not found",
        });
      }

      res.json({
        success: true,
        data: shippingClass,
      });
    } catch (error) {
      console.error("Error fetching shipping class:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch shipping class",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

