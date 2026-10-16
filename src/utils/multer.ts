import multer from "multer";

export const memoryStorage = multer.memoryStorage();
export const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
});
