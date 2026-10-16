import { Request, Response } from "express";
import { BrandService } from "../../services/admin/brand.service";
import { z } from "zod";

// const createBrandSchema = z.object({
//   name: z.string().min(1, "Name is required").max(255, "Name too long"),
//   slug: z.string().min(1, "Slug is required").max(255, "Slug too long"),
//   description: z.string().optional(),
//   website: z.string().url("Invalid website URL").optional().or(z.literal("")),
//   isActive: z.boolean().default(true),
//   isFeatured: z.boolean().default(false),
//   seoTitle: z.string().max(255, "SEO title too long").optional(),
//   seoDescription: z.string().optional(),
// });

// const updateBrandSchema = createBrandSchema.partial();

const bulkUpdateStatusSchema = z.object({
  ids: z.array(z.number().int().positive()),
  isActive: z.boolean(),
});

const bulkUpdateFeaturedSchema = z.object({
  ids: z.array(z.number().int().positive()),
  isFeatured: z.boolean(),
});

export class BrandController {
  static async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
        name,
        isActive,
        isFeatured,
      } = req.query;

      const result = await BrandService.getAll({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as "asc" | "desc",
        filters: {
          name: name as string,
          isActive: isActive ? isActive === "true" : undefined,
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
      const brand = await BrandService.getById(parseInt(id));

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
      const brand = await BrandService.getBySlug(slug);

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

  static async create(req: Request, res: Response) {
    try {
      // const validatedData = createBrandSchema.parse(req.body);
      const brand = await BrandService.create(req.body);

      res.status(201).json({
        success: true,
        data: brand,
        message: "Brand created successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      console.error("Error creating brand:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create brand",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // const validatedData = updateBrandSchema.parse(req.body);
      
      const brand = await BrandService.update(parseInt(id), req.body);

      if (!brand) {
        return res.status(404).json({
          success: false,
          message: "Brand not found",
        });
      }

      res.json({
        success: true,
        data: brand,
        message: "Brand updated successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      console.error("Error updating brand:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update brand",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const brand = await BrandService.delete(parseInt(id));

      if (!brand) {
        return res.status(404).json({
          success: false,
          message: "Brand not found",
        });
      }

      res.json({
        success: true,
        message: "Brand deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete brand",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getWithStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const brand = await BrandService.getWithStats(parseInt(id));

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
      console.error("Error fetching brand stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch brand stats",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getFeaturedBrands(req: Request, res: Response) {
    try {
      const brands = await BrandService.getFeaturedBrands();

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
      const brands = await BrandService.getActiveBrands();

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

      const brands = await BrandService.searchBrands(q, parseInt(limit as string));

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

  static async bulkUpdateStatus(req: Request, res: Response) {
    try {
      const validatedData = bulkUpdateStatusSchema.parse(req.body);
      const brands = await BrandService.bulkUpdateStatus(
        validatedData.ids,
        validatedData.isActive
      );

      res.json({
        success: true,
        data: brands,
        message: `Brands ${validatedData.isActive ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      console.error("Error bulk updating brand status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to bulk update brand status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async bulkUpdateFeatured(req: Request, res: Response) {
    try {
      const validatedData = bulkUpdateFeaturedSchema.parse(req.body);
      const brands = await BrandService.bulkUpdateFeatured(
        validatedData.ids,
        validatedData.isFeatured
      );

      res.json({
        success: true,
        data: brands,
        message: `Brands ${validatedData.isFeatured ? "featured" : "unfeatured"} successfully`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      console.error("Error bulk updating featured status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to bulk update featured status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

