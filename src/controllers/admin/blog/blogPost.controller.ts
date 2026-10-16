import { Request, Response } from "express";
import { BlogPostService } from "../../../services/admin/blog/blogPost.service";
import { successResponse, errorResponse } from "../../../utils/apiResponse";

export class BlogPostController {
  static async getAll(req: Request, res: Response) {
    try {
      const posts = await BlogPostService.getAll();
      return successResponse(res, posts);
    } catch (error) {
      return errorResponse(res, "خطا در دریافت پست‌ها");
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const post = await BlogPostService.getById(id);
      return successResponse(res, post);
    } catch (error) {
      return errorResponse(res, "پست یافت نشد");
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const post = await BlogPostService.create(req.body);
      return successResponse(res, post, "پست با موفقیت ایجاد شد");
    } catch (error) {
      return errorResponse(res, "خطا در ایجاد پست");
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const post = await BlogPostService.update(id, req.body);
      return successResponse(res, post, "پست با موفقیت ویرایش شد");
    } catch (error) {
      console.log(error);
      return errorResponse(res, "خطا در ویرایش پست");
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await BlogPostService.remove(id);
      return successResponse(res, null, "پست با موفقیت حذف شد");
    } catch (error) {
      return errorResponse(res, "خطا در حذف پست");
    }
  }
}
