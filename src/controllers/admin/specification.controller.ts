import { Request, Response } from "express";
import { specificationService } from "../../services/admin/specification.service";
import {
  getNumberOrUndefined,
  getString,
  isValidSortBy,
  isValidSortOrder,
} from "../../utils/filterFormatter";
import { errorResponse, successResponse } from "../../utils/apiResponse";
import { slugify } from "../../utils/slugify";

export class SpecificationController {
  // Specification Management
  async getAllSpecifications(req: Request, res: Response) {
    try {
      const { type, sortBy, sortOrder, page, limit, search } = req.query;

      const filters = {
        type: getString(type),
        sortBy: isValidSortBy(sortBy) ? (sortBy as any) : undefined,
        sortOrder: isValidSortOrder(sortOrder) ? (sortOrder as any) : undefined,
        page: getNumberOrUndefined(page),
        limit: getNumberOrUndefined(limit),
        search: getString(search),
      };

      const specifications =
        await specificationService.getPaginatedSpecifications(filters);
      res.json(specifications);
    } catch (error) {
      console.error("Error fetching specifications:", error);
      res.status(500).json({ error: "Failed to fetch specifications" });
    }
  }

  async getSpecification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const specification =
        await specificationService.getSpecificationWithOptions(Number(id));

      if (!specification) {
        return res.status(404).json({ error: "Specification not found" });
      }

      return successResponse(res, specification);
    } catch (error) {
      console.error("Error fetching specification:", error);
      return errorResponse(res);
    }
  }

  async createSpecification(req: Request, res: Response) {
    try {
      const {
        name,
        description,
        type,
        unit,
        isSearchable,
        isFilterable,
        slug,
        isComparable,
        options,
      } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: "Name and type are required" });
      }

      const validTypes = [
        "text",
        "number",
        "boolean",
        "select",
        "multi_select",
      ];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid specification type" });
      }

      const specification = await specificationService.createSpecification({
        name,
        description,
        type,
        unit,
        slug: slug ?? slugify(name),
        isSearchable: isSearchable ?? true,
        isFilterable: isFilterable ?? true,
        isComparable: isComparable ?? true,
      });

      // If options are provided for select/multi-select types, create them
      if (
        (type === "select" || type === "multi_select") &&
        options &&
        Array.isArray(options)
      ) {
        await specificationService.bulkCreateSpecificationOptions(
          specification.id,
          options
        );
      }

      const fullSpecification =
        await specificationService.getSpecificationWithOptions(
          specification.id
        );
      return successResponse(res, fullSpecification);
    } catch (error) {
      console.error("Error creating specification:", error);
      return errorResponse(res);
    }
  }

  async updateSpecification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const { options, ...specData } = updateData;

      // Handle slug generation if name is being updated but slug is not provided
      if (specData.name && !specData.slug) {
        specData.slug = slugify(specData.name);
      }

      const updatedSpec = await specificationService.updateSpecification(
        Number(id),
        specData
      );

      if (!updatedSpec) {
        return res.status(404).json({ error: "Specification not found" });
      }

      // Update options if provided
      if (options && Array.isArray(options)) {
        // Delete existing options and create new ones
        const existingOptions =
          await specificationService.getSpecificationOptions(Number(id));
        for (const option of existingOptions) {
          await specificationService.deleteSpecificationOption(option.id);
        }
        await specificationService.bulkCreateSpecificationOptions(
          Number(id),
          options
        );
      }

      const fullSpecification =
        await specificationService.getSpecificationWithOptions(Number(id));
      return successResponse(res, fullSpecification);
    } catch (error) {
      console.error("Error updating specification:", error);
      return errorResponse(res);
    }
  }

  async deleteSpecification(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const specification = await specificationService.getSpecificationById(
        Number(id)
      );
      if (!specification) {
        return res.status(404).json({ error: "Specification not found" });
      }

      await specificationService.deleteSpecification(Number(id));
      return successResponse(res, {
        message: "Specification deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting specification:", error);
      return errorResponse(res);
    }
  }

  // Specification Options Management
  async getSpecificationOptions(req: Request, res: Response) {
    try {
      const { specificationId } = req.params;
      const options = await specificationService.getSpecificationOptions(
        Number(specificationId)
      );
      return successResponse(res, options);
    } catch (error) {
      console.error("Error fetching specification options:", error);
      return errorResponse(res);
    }
  }

  async createSpecificationOption(req: Request, res: Response) {
    try {
      const { specificationId } = req.params;
      const { value, label, description, order, isActive } = req.body;

      if (!value) {
        return errorResponse(res, "مقدار الزامی است");
      }

      const option = await specificationService.createSpecificationOption({
        specificationId: Number(specificationId),
        value,
        label: label ?? value,
        description: description ?? "",
        order: order ?? 0,
        isActive: isActive ?? true,
      });

      return successResponse(res, option);
    } catch (error) {
      console.error("Error creating specification option:", error);
      return errorResponse(res);
    }
  }

  async updateSpecificationOption(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedOption =
        await specificationService.updateSpecificationOption(
          Number(id),
          updateData
        );

      if (!updatedOption) {
        return res
          .status(404)
          .json({ error: "Specification option not found" });
      }

      return successResponse(res, updatedOption);
    } catch (error) {
      console.error("Error updating specification option:", error);
      return errorResponse(res);
    }
  }

  async deleteSpecificationOption(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await specificationService.deleteSpecificationOption(Number(id));
      return successResponse(res, {
        message: "Specification option deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting specification option:", error);
      return errorResponse(res);
    }
  }

  // Product Specifications Management
  async getProductSpecifications(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const specifications =
        await specificationService.getProductSpecifications(Number(productId));
      return successResponse(res, specifications);
    } catch (error) {
      console.error("Error fetching product specifications:", error);
      return errorResponse(res);
    }
  }

  async setProductSpecification(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { specificationId, value, optionId, optionIds } = req.body;

      if (!specificationId) {
        return res.status(400).json({ error: "Specification ID is required" });
      }

      const productSpec = await specificationService.setProductSpecification({
        productId: Number(productId),
        specificationId,
        value,
        optionId,
      });

      // Handle multi-select options
      if (optionIds && Array.isArray(optionIds)) {
        await specificationService.setProductSpecificationOptions(
          productSpec.id,
          optionIds
        );
      }

      const fullProductSpecs =
        await specificationService.getProductSpecifications(Number(productId));
      return successResponse(res, fullProductSpecs);
    } catch (error) {
      console.error("Error setting product specification:", error);
      return errorResponse(res);
    }
  }

  async deleteProductSpecification(req: Request, res: Response) {
    try {
      const { productId, specificationId } = req.params;
      await specificationService.deleteProductSpecification(
        Number(productId),
        Number(specificationId)
      );
      return successResponse(res, {
        message: "Product specification deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product specification:", error);
      return errorResponse(res);
    }
  }

  // Product Filtering
  async filterProductsBySpecifications(req: Request, res: Response) {
    try {
      const { specifications } = req.body;

      if (!specifications || !Array.isArray(specifications)) {
        return res
          .status(400)
          .json({ error: "Specifications array is required" });
      }

      const productIds =
        await specificationService.filterProductsBySpecifications({
          specifications,
        });
      return successResponse(res, { productIds });
    } catch (error) {
      console.error("Error filtering products by specifications:", error);
      return errorResponse(res);
    }
  }

  // Category Specifications
  async getSpecificationsByCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;
      const specifications =
        await specificationService.getSpecificationsByCategory(
          Number(categoryId)
        );
      return successResponse(res, specifications);
    } catch (error) {
      console.error("Error fetching category specifications:", error);
      return errorResponse(res);
    }
  }

  // Statistics
  async getSpecificationStats(req: Request, res: Response) {
    try {
      const stats = await specificationService.getSpecificationStats();
      return successResponse(res, stats);
    } catch (error) {
      console.error("Error fetching specification stats:", error);
      return errorResponse(res);
    }
  }
}

export const specificationController = new SpecificationController();
