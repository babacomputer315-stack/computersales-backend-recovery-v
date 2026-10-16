import { Request, Response } from "express";
import { UserCategorySpecificationService } from "../../services/user/categorySpecification.service";

export class UserCategorySpecificationController {
  static async getByCategoryId(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;
      const id = parseInt(categoryId);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      const specifications =
        await UserCategorySpecificationService.getByCategoryId(id);

      res.json({
        success: true,
        data: specifications,
      });
    } catch (error) {
      console.error("Error fetching category specifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch category specifications",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getByCategorySlug(req: Request, res: Response) {
    try {
      const { categorySlug } = req.params;

      if (!categorySlug) {
        return res.status(400).json({
          success: false,
          message: "Category slug is required",
        });
      }

      const specifications =
        await UserCategorySpecificationService.getByCategorySlug(categorySlug);

      res.json({
        success: true,
        data: specifications,
      });
    } catch (error) {
      console.error("Error fetching category specifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch category specifications",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getByCategoryIdOrSlug(req: Request, res: Response) {
    try {
      const { identifier } = req.params;

      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: "Category identifier is required",
        });
      }

      // Check if identifier is a number (ID) or string (slug)
      const id = parseInt(identifier);
      const isNumeric = !isNaN(id);

      const specifications =
        await UserCategorySpecificationService.getByCategoryIdOrSlug(
          isNumeric ? id : identifier
        );

      res.json({
        success: true,
        data: specifications,
      });
    } catch (error) {
      console.error("Error fetching category specifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch category specifications",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
