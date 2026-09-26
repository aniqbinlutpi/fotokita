import { eq } from "drizzle-orm";

import { db } from "../db";
import { media } from "../db/schema";
import { uploadToS3 } from "../lib/s3";
import { generateStorageKey } from "../utils/storage";
import { generatePresignedUrl } from "../lib/s3";


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

export async function getMediaByWeddingId(weddingId: string) {
  return db
    .select()
    .from(media)
    .where(eq(media.weddingId, weddingId));
}

export async function getMediaById(id: string) {
  const [result] = await db
    .select()
    .from(media)
    .where(eq(media.id, id));

  return result;
}

export async function getMediaUrl(id: string) {
  const mediaItem = await getMediaById(id);

  if (!mediaItem) {
    return null;
  }

  const url = await generatePresignedUrl(mediaItem.storageKey);

  return {
    ...mediaItem,
    url,
  };
}
