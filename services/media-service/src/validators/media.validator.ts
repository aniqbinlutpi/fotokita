import { z } from "zod";
import {
  ALLOWED_MIME_TYPES,
  getMaxFileSizeForMime,
  isAllowedMimeType,
  isVideoMimeType,
  MEDIA_LIMITS,
} from "../config/media.config";
import { sanitizeFilename } from "../utils/filename";

export {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  ALLOWED_MIME_TYPES,
  MEDIA_LIMITS,
} from "../config/media.config";
export { sanitizeFilename } from "../utils/filename";

export const createMediaSchema = z.object({
  weddingId: z.uuid(),
});

export const mediaIdParamSchema = z.object({
  id: z.uuid(),
});

export const getMediaQuerySchema = z.object({
  weddingId: z.uuid(),
});


export type ValidateUploadSuccess = {
  weddingId: string;
  file: File;
  sanitizedFilename: string;
};

export type ValidateUploadFailure = {
  code: "VALIDATION_ERROR";
  message: string;
  details: {
    fieldErrors: Record<string, string[]>;
  };
};

export type ValidateUploadResult =
  | { success: true; data: ValidateUploadSuccess }
  | { success: false; error: ValidateUploadFailure };

export function validateMediaUpload(input: {
  weddingId?: unknown;
  file?: unknown;
}): ValidateUploadResult {
  const fieldErrors: Record<string, string[]> = {};

  // 1. Validate weddingId
  const weddingIdResult = createMediaSchema.safeParse({
    weddingId: input.weddingId,
  });
  if (!weddingIdResult.success) {
    const flattened = weddingIdResult.error.flatten();
    fieldErrors.weddingId =
      flattened.fieldErrors.weddingId && flattened.fieldErrors.weddingId.length > 0
        ? flattened.fieldErrors.weddingId
        : ["Invalid wedding ID format"];
  }

  // 2. Validate file presence
  const file = input.file;
  if (!file || !(file instanceof File) || typeof file.arrayBuffer !== "function") {
    fieldErrors.file = ["File is required"];
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: { fieldErrors },
      },
    };
  }

  // 3. Validate MIME type
  const mimeType = file.type;
  if (!isAllowedMimeType(mimeType)) {
    fieldErrors.file = [
      `Unsupported file type: ${mimeType || "unknown"}. Allowed types are: ${ALLOWED_MIME_TYPES.join(", ")}`,
    ];
  } else {
    // 4. Validate file size
    const maxSizeBytes = getMaxFileSizeForMime(mimeType);
    if (maxSizeBytes !== null && file.size > maxSizeBytes) {
      const isVideo = isVideoMimeType(mimeType);
      const limitMb = isVideo
        ? MEDIA_LIMITS.MAX_VIDEO_SIZE_BYTES / (1024 * 1024)
        : MEDIA_LIMITS.MAX_IMAGE_SIZE_BYTES / (1024 * 1024);
      fieldErrors.file = [
        `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size of ${limitMb}MB for ${isVideo ? "videos" : "images"}`,
      ];
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: { fieldErrors },
      },
    };
  }

  const sanitizedFilename = sanitizeFilename(file.name);

  return {
    success: true,
    data: {
      weddingId: weddingIdResult.data!.weddingId,
      file,
      sanitizedFilename,
    },
  };
}
