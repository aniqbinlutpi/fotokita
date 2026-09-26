export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
] as const;

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MEDIA_LIMITS = {
  MAX_IMAGE_SIZE_BYTES:
    Number(process.env.MAX_IMAGE_SIZE_BYTES) || 10 * 1024 * 1024, // 10 MB
  MAX_VIDEO_SIZE_BYTES:
    Number(process.env.MAX_VIDEO_SIZE_BYTES) || 100 * 1024 * 1024, // 100 MB
};

export function isImageMimeType(mimeType: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isVideoMimeType(mimeType: string): boolean {
  return (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isAllowedMimeType(
  mimeType: string,
): mimeType is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function getMaxFileSizeForMime(mimeType: string): number | null {
  if (isImageMimeType(mimeType)) {
    return MEDIA_LIMITS.MAX_IMAGE_SIZE_BYTES;
  }
  if (isVideoMimeType(mimeType)) {
    return MEDIA_LIMITS.MAX_VIDEO_SIZE_BYTES;
  }
  return null;
}
