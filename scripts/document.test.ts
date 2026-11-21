import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { validateUploadedFileContent } from "../src/utils/file.utils";

const uploadDir = path.join(process.cwd(), "uploads");

const withTemporaryUpload = async (
  content: string | Buffer,
  callback: (storageKey: string) => Promise<void>,
) => {
  await mkdir(uploadDir, { recursive: true });
  const storageKey = `test-${randomUUID()}`;
  const filePath = path.join(uploadDir, storageKey);

  await writeFile(filePath, content);

  try {
    await callback(storageKey);
  } finally {
    await rm(filePath, { force: true });
  }
};

test("accepts valid UTF-8 text uploads", async () => {
  await withTemporaryUpload("Document text", async (storageKey) => {
    assert.equal(
      await validateUploadedFileContent(storageKey, "text/plain"),
      true,
    );
  });
});

test("rejects invalid UTF-8 text uploads", async () => {
  await withTemporaryUpload(
    Buffer.from([0xc3, 0x28]),
    async (storageKey) => {
      assert.equal(
        await validateUploadedFileContent(storageKey, "text/plain"),
        false,
      );
    },
  );
});

test("checks PDF file signatures", async () => {
  await withTemporaryUpload("%PDF-1.7", async (storageKey) => {
    assert.equal(
      await validateUploadedFileContent(storageKey, "application/pdf"),
      true,
    );
  });

  await withTemporaryUpload("not a PDF", async (storageKey) => {
    assert.equal(
      await validateUploadedFileContent(storageKey, "application/pdf"),
      false,
    );
  });
});
