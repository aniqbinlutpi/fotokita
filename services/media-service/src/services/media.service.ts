import { db } from "../db";
import { media } from "../db/schema";
import { uploadToS3 } from "../lib/s3";
import { generateStorageKey } from "../utils/storage";

type CreateMediaInput = {
  weddingId: string;
  file: Buffer;
  filename: string;
  mimeType: string;
  size: number;
};

export async function createMedia(input: CreateMediaInput) {
  const storageKey = generateStorageKey(
    input.weddingId,
    input.filename,
  );

  await uploadToS3({
    key: storageKey,
    file: input.file,
    contentType: input.mimeType,
  });

  const [createdMedia] = await db
    .insert(media)
    .values({
      weddingId: input.weddingId,
      storageKey,
      filename: input.filename,
      mimeType: input.mimeType,
      size: input.size,
    })
    .returning();

  return createdMedia;
}
