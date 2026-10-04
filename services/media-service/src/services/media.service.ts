import { eq } from "drizzle-orm";

import { db } from "../db";
import { media } from "../db/schema";
import {
  deleteFromS3,
  deleteObjectsFromS3,
  generatePresignedUrl,
  uploadToS3,
} from "../lib/s3";
import { generateStorageKey } from "../utils/storage";


type CreateMediaInput = {
  weddingId: string;
  file: Buffer;
  filename: string;
  mimeType: string;
  size: number;
  wishes?: string;
  fromName?: string;
  signature?: string;
  secretCode?: string;
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
      wishes: input.wishes,
      fromName: input.fromName,
      signature: input.signature,
      secretCode: input.secretCode,
    })
    .returning();

  return createdMedia;
}

export async function getMediaByWeddingId(weddingId: string) {
  const items = await db
    .select({
      id: media.id,
      weddingId: media.weddingId,
      filename: media.filename,
      mimeType: media.mimeType,
      size: media.size,
      wishes: media.wishes,
      fromName: media.fromName,
      signature: media.signature,
      createdAt: media.createdAt,
    })
    .from(media)
    .where(eq(media.weddingId, weddingId));

  return items.map(({ storageKey: _storageKey, secretCode: _secretCode, ...rest }: any) => rest);
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

export type DeleteMediaResult =
  | { success: true; data: { id: string } }
  | { success: false; status: 403 | 404 | 500; code: string; message: string };

export async function deleteMedia(id: string, code?: string): Promise<DeleteMediaResult> {
  const mediaItem = await getMediaById(id);

  if (!mediaItem) {
    return {
      success: false,
      status: 404,
      code: "MEDIA_NOT_FOUND",
      message: "Media not found",
    };
  }

  // Validate secret code if one was configured on upload
  // Admin cheatcode "ggwp" bypasses user secret code
  if (mediaItem.secretCode) {
    const isBypassAdmin = code?.trim() === "ggwp";
    const isOwnerCode = Boolean(code && code.trim() === mediaItem.secretCode.trim());

    if (!isBypassAdmin && !isOwnerCode) {
      return {
        success: false,
        status: 403,
        code: "INVALID_SECRET_CODE",
        message: "Incorrect secret code. Only the uploader or admin can delete this photograph.",
      };
    }
  }

  try {
    await deleteFromS3(mediaItem.storageKey);
  } catch (err) {
    console.error("Failed to delete S3 object:", err);
    return {
      success: false,
      status: 500,
      code: "S3_DELETE_FAILED",
      message: "Failed to delete media file from storage",
    };
  }

  try {
    const [deleted] = await db
      .delete(media)
      .where(eq(media.id, id))
      .returning();

    if (!deleted) {
      return {
        success: false,
        status: 404,
        code: "MEDIA_NOT_FOUND",
        message: "Media not found",
      };
    }

    return {
      success: true,
      data: {
        id: deleted.id,
      },
    };
  } catch (err) {
    console.error(
      "Failed to delete media from database after S3 deletion (partial failure):",
      err,
    );
    return {
      success: false,
      status: 500,
      code: "DATABASE_ERROR",
      message: "Failed to delete media record from database",
    };
  }
}

export async function deleteMediaByWeddingId(weddingId: string): Promise<{ deletedCount: number }> {
  try {
    const items = await db
      .select({ id: media.id, storageKey: media.storageKey })
      .from(media)
      .where(eq(media.weddingId, weddingId));

    if (items.length === 0) {
      return { deletedCount: 0 };
    }

    // Delete S3 files
    const keys = items.map((item) => item.storageKey);
    await deleteObjectsFromS3(keys);

    // Delete database records
    await db.delete(media).where(eq(media.weddingId, weddingId));

    return { deletedCount: items.length };
  } catch (err) {
    console.error(`Failed to delete media for weddingId ${weddingId}:`, err);
    throw err;
  }
}

