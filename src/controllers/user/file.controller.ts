import { Request, Response } from "express";
import * as fileService from "../../services/user/file.service";
import { NewFile } from "../../db/schema";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    if (!Array.isArray(req.files)) {
      const file = req.files as unknown as Express.Multer.File;
      const uploadResult = await processSingleFile(file);
      return res.status(201).json({
        message: "",
        files: [uploadResult],
      });
    }

    const files = req.files as Express.Multer.File[];
    const uploadResults = await Promise.all(files.map(processSingleFile));

    return res.status(201).json({
      message: "",
      files: uploadResults,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

async function processSingleFile(file: Express.Multer.File) {
  const uploadResult = await fileService.uploadToS3(file);
  if (!uploadResult.isOk) {
    throw new Error("Failed to upload file to storage");
  }

  const dbFile: NewFile = {
    name: uploadResult.filename,
    size: file.size,
    type: file.mimetype,
  };

  const savedFile = await fileService.createFileRecord(dbFile);
  return savedFile;
}
