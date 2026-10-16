import { Request, Response } from "express";
import * as fileService from "../../services/admin/file.service";
import { NewFile } from "../../db/schema";
import { successResponse } from "../../utils/apiResponse";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    if (!Array.isArray(req.files)) {
      const file = req.files as unknown as Express.Multer.File;
      const uploadResult = await processSingleFile(file);
      return res.status(201).json({
        message: "File uploaded successfully",
        files: [uploadResult],
      });
    }

    const files = req.files as Express.Multer.File[];
    const uploadResults = await Promise.all(files.map(processSingleFile));

    return res.status(201).json({
      message: "Files uploaded successfully",
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

export const getFile = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const file = await fileService.getFileRecord(filename);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const fileData = await fileService.getFromS3(filename);

    res.setHeader("Content-Type", file.type || "");
    res.setHeader("Content-Length", file.size || "");
    res.setHeader("Content-Disposition", `inline; filename="${file.name}"`);

    return res.send(fileData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    await fileService.deleteFromS3(filename);

    await fileService.deleteFileRecord(filename);

    return res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const listFiles = async (req: Request, res: Response) => {
  try {
    const files = await fileService.getAllFiles();
    return successResponse(res, files);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
