import { Request, Response } from "express";
import { BannerService } from "../../services/admin/banner.service";
import { z } from "zod";

const createBannerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  imageId: z.number().int().positive().optional(),
  link: z.string().url("Invalid link URL").optional().or(z.literal("")),
});

const updateBannerSchema = createBannerSchema.partial();

const bulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()),
});

export class BannerController {
  static async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
        name,
      } = req.query;

      const result = await BannerService.getAll({
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
      const banner = await BannerService.getById(parseInt(id));

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

  static async create(req: Request, res: Response) {
    try {
      const validatedData = createBannerSchema.parse(req.body);
      const banner = await BannerService.create(validatedData);

      res.status(201).json({
        success: true,
        data: banner,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      console.error("Error creating banner:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create banner",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { name } = req.body;
      // const validatedData = updateBannerSchema.parse(req.body);
      
      const banner = await BannerService.update(name, req.body);

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
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      console.error("Error updating banner:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update banner",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const banner = await BannerService.delete(parseInt(id));

      if (!banner) {
        return res.status(404).json({
          success: false,
          message: "Banner not found",
        });
      }

      res.json({
        success: true,
        message: "Banner deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting banner:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete banner",
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

      const banners = await BannerService.searchBanners(
        q,
        parseInt(limit as string)
      );

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

  static async bulkDelete(req: Request, res: Response) {
    try {
      const validatedData = bulkDeleteSchema.parse(req.body);
      const banners = await BannerService.bulkDelete(validatedData.ids);

      res.json({
        success: true,
        data: banners,
        message: `${banners.length} banner(s) deleted successfully`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      console.error("Error bulk deleting banners:", error);
      res.status(500).json({
        success: false,
        message: "Failed to bulk delete banners",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
