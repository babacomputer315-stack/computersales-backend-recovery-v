import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { files } from "../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db/client";

const client = new S3Client({
  region: "default",
  endpoint: process.env.LIARA_ENDPOINT,
  credentials: {
    accessKeyId: process.env.LIARA_ACCESS_KEY || "",
    secretAccessKey: process.env.LIARA_SECRET_KEY || "",
  },
});

export const uploadFile = async (file: Express.Multer.File) => {
  try {
    const randomString = Math.random().toString(36).substring(2, 8);
    // const filename = `${Date.now()}-${randomString}.${
    //   file.mimetype.split("/")[1]
    // }`;
    const fileFounded = await db
      .select()
      .from(files)
      .where(eq(files.name, file.originalname));

    let filename = ``;

    if (fileFounded.length > 0) {
      filename = `${file.originalname.split(".")[0]}-${randomString}.${
        file.originalname.split(".")[1]
      }`;
    } else {
      filename = `${file.originalname}`;
    }

    const params = {
      Body: file.buffer,
      Bucket: process.env.LIARA_BUCKET_NAME,
      Key: filename,
    };

    const result = await client.send(new PutObjectCommand(params));

    return { result, filename, isOk: true };
  } catch (error) {
    console.log(error);
    return { result: "", filename: "", isOk: false };
  }
};

export const getFile = async (filename: string) => {
  try {
    const params = {
      Bucket: process.env.LIARA_BUCKET_NAME,
      Key: filename,
    };

    const data = await client.send(new GetObjectCommand(params));

    if (data.Body instanceof Readable) {
      return await streamToBuffer(data.Body);
    }

    return data.Body;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteFile = async (filename: string) => {
  try {
    const params = {
      Bucket: process.env.LIARA_BUCKET_NAME,
      Key: filename,
    };

    await client.send(new DeleteObjectCommand(params));
    return { ok: true };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const streamToBuffer = (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
};
