import { db } from "../../db/client";
import { files } from "../../db/schema";
import { desc, eq } from "drizzle-orm";
import {
  uploadFile as uploadToS3Storage,
  getFile as getFromS3Storage,
  deleteFile as deleteFromS3Storage,
} from "../../utils/upload";
import { NewFile } from "../../db/schema/files";

export const uploadToS3 = uploadToS3Storage;
export const getFromS3 = getFromS3Storage;
export const deleteFromS3 = deleteFromS3Storage;

export const createFileRecord = async (fileData: NewFile) => {
  const [file] = await db.insert(files).values(fileData).returning();
  return file;
};

export const getFileRecord = async (filename: string) => {
  const [file] = await db
    .select()
    .from(files)
    .where(eq(files.name, filename))
    .limit(1);
  return file;
};

export const deleteFileRecord = async (filename: string) => {
  await db.delete(files).where(eq(files.name, filename));
};

export const getAllFiles = async () => {
  return await db.select().from(files).orderBy(desc(files.createdAt));
};
