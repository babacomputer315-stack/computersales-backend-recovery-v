import { Request, Response } from "express";
import { UserBannerService } from "../../services/user/banner.service";

export class UserBannerController {
  static async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
        name,
      } = req.query;

      const result = await UserBannerService.getAll({
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
      console.error("Error fetching banners:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch banners",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const banner = await UserBannerService.getById(parseInt(id));

      if (!banner) {
        return res.status(404).json({
          success: false,
          message: "Banner not found",
        });
      }

      res.json({
        success: true,
        data: banner,
      });
    } catch (error) {
      console.error("Error fetching banner:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch banner",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getActiveBanners(req: Request, res: Response) {
    try {
      const banners = await UserBannerService.getActiveBanners();

      res.json({
        success: true,
        data: banners,
      });
    } catch (error) {
      console.error("Error fetching active banners:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch active banners",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async searchBanners(req: Request, res: Response) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const banners = await UserBannerService.searchBanners(q, parseInt(limit as string));

      res.json({
        success: true,
        data: banners,
      });
    } catch (error) {
      console.error("Error searching banners:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search banners",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}