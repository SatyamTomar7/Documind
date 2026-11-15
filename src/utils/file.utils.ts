import fs from "fs/promises";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads");

export const deleteUploadedFile = async (storageKey: string) => {
  const filePath = path.join(uploadDir, storageKey);

  await fs.unlink(filePath);
};