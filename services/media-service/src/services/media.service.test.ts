import { beforeEach, expect, mock, test } from "bun:test";

const uploaded: string[] = [];
const deleted: string[] = [];
let insertShouldFail = false;
let uploadShouldFail = false;
let deleteShouldFail = false;

mock.module("../lib/s3", () => ({
  uploadToS3: async ({ key }: { key: string }) => {
    if (uploadShouldFail) throw new Error("s3 down");
    uploaded.push(key);
  },
  deleteFromS3: async (key: string) => {
    if (deleteShouldFail) throw new Error("delete failed");
    deleted.push(key);
  },
  deleteObjectsFromS3: async () => {},
  generatePresignedUrl: async () => "",
}));

mock.module("../db", () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: async () => {
          if (insertShouldFail) throw new Error("db down");
          return [{ id: "1" }];
        },
      }),
    }),
  },
}));

const { createMedia, MediaError } = await import("./media.service");

const input = {
  weddingId: "550e8400-e29b-41d4-a716-446655440000",
  file: Buffer.from("x"),
  filename: "a.jpg",
  mimeType: "image/jpeg",
  size: 1,
};

beforeEach(() => {
  uploaded.length = 0;
  deleted.length = 0;
  insertShouldFail = false;
  uploadShouldFail = false;
  deleteShouldFail = false;
});

test("keeps the object when the database insert succeeds", async () => {
  await createMedia(input);
  expect(uploaded).toHaveLength(1);
  expect(deleted).toHaveLength(0);
});

test("removes the uploaded object when the database insert fails", async () => {
  insertShouldFail = true;
  const err = await createMedia(input).catch((e) => e);
  expect(err).toBeInstanceOf(MediaError);
  expect(err.code).toBe("DATABASE_ERROR");
  expect(deleted).toEqual(uploaded);
});

test("still reports DATABASE_ERROR when the orphan cleanup itself fails", async () => {
  insertShouldFail = true;
  deleteShouldFail = true;
  const err = await createMedia(input).catch((e) => e);
  expect(err.code).toBe("DATABASE_ERROR");
});

test("reports S3_UPLOAD_FAILED and never touches the database path", async () => {
  uploadShouldFail = true;
  const err = await createMedia(input).catch((e) => e);
  expect(err.code).toBe("S3_UPLOAD_FAILED");
  expect(deleted).toHaveLength(0);
});
