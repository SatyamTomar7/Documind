import fs from "fs/promises";
import path from "path";
import { TextDecoder } from "util";

const uploadDir = path.join(process.cwd(), "uploads");

export const deleteUploadedFile = async (storageKey: string) => {
  const filePath = path.join(uploadDir, storageKey);

  await fs.unlink(filePath);
};

export const validateUploadedFileContent = async (
  storageKey: string,
  mimeType: string,
) => {
  const filePath = path.join(uploadDir, storageKey);
  const fileBuffer = await fs.readFile(filePath);

  if (mimeType === "application/pdf") {
    return fileBuffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return (
      fileBuffer.length >= 4 &&
      fileBuffer[0] === 0x50 &&
      fileBuffer[1] === 0x4b &&
      fileBuffer[2] === 0x03 &&
      fileBuffer[3] === 0x04
    );
  }

  if (mimeType === "text/plain") {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(fileBuffer);
      return true;
    } catch {
      return false;
    }
  }

  return false;
};