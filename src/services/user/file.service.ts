import { db } from "../../db/client";
import { files } from "../../db/schema";
import { uploadFile as uploadToS3Storage } from "../../utils/upload";
import { NewFile } from "../../db/schema/files";

export const uploadToS3 = uploadToS3Storage;

export const createFileRecord = async (fileData: NewFile) => {
  const [file] = await db.insert(files).values(fileData).returning();
  return file;
};
