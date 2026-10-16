import { Request, Response } from "express";
import { UserBrandService } from "../../services/user/brand.service";

export class UserBrandController {
  static async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "name",
        sortOrder = "asc",
        name,
        isFeatured,
      } = req.query;

      const result = await UserBrandService.getAll({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as "asc" | "desc",
        filters: {
          name: name as string,
          isFeatured: isFeatured ? isFeatured === "true" : undefined,
        },
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch brands",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const brand = await UserBrandService.getById(parseInt(id));

      if (!brand) {
        return res.status(404).json({
          success: false,
          message: "Brand not found",
        });
      }

      res.json({
        success: true,
        data: brand,
      });
    } catch (error) {
      console.error("Error fetching brand:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch brand",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const brand = await UserBrandService.getBySlug(slug);

      if (!brand) {
        return res.status(404).json({
          success: false,
          message: "Brand not found",
        });
      }

      res.json({
        success: true,
        data: brand,
      });
    } catch (error) {
      console.error("Error fetching brand:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch brand",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getFeaturedBrands(req: Request, res: Response) {
    try {
      const brands = await UserBrandService.getFeaturedBrands();

      res.json({
        success: true,
        data: brands,
      });
    } catch (error) {
      console.error("Error fetching featured brands:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch featured brands",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getActiveBrands(req: Request, res: Response) {
    try {
      const brands = await UserBrandService.getActiveBrands();

      res.json({
        success: true,
        data: brands,
      });
    } catch (error) {
      console.error("Error fetching active brands:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch active brands",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async searchBrands(req: Request, res: Response) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const brands = await UserBrandService.searchBrands(q, parseInt(limit as string));

      res.json({
        success: true,
        data: brands,
      });
    } catch (error) {
      console.error("Error searching brands:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search brands",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getBrandsWithProductCount(req: Request, res: Response) {
    try {
      const brands = await UserBrandService.getBrandsWithProductCount();

      res.json({
        success: true,
        data: brands,
      });
    } catch (error) {
      console.error("Error fetching brands with product count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch brands with product count",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

