import type { Wedding } from "@/types/wedding";
import { getMediaProxyUrl } from "@/api/media";
import { parseSignature, trimImageBoundingBox } from "./signature";

export interface PhotoboothRenderOptions {
  width?: number; // Target total card width in px (default: 1600px for high-res print)
  coupleName?: string;
  weddingDate?: string;
  watermark?: string;
  wishes?: string;
  from?: string;
  signature?: string;
}

/**
 * Loads an image from a URL or object URL.
 * Routes remote URLs through direct CORS fetch or backend media proxy
 * as a local blob to guarantee clean canvas exports without CORS taint.
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  // 1. If already a local blob or data URL, load directly
  if (src.startsWith("blob:") || src.startsWith("data:")) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  // 2. Try direct CORS fetch first (fastest, zero server load if S3 bucket has CORS enabled)
  try {
    const directRes = await fetch(src, { mode: "cors" });
    const contentType = directRes.headers.get("content-type") || "";
    if (directRes.ok && contentType.startsWith("image/")) {
      const blob = await directRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
          URL.revokeObjectURL(blobUrl);
          reject(err);
        };
        img.src = blobUrl;
      });
    }
  } catch {
    // Direct CORS fetch failed (e.g. S3 CORS headers not configured), fall through to backend proxy
  }

  // 3. For remote URLs, route through backend media proxy to bypass S3 CORS restrictions
  const proxyCandidates = [
    getMediaProxyUrl(src),
    `/api/proxy-image?url=${encodeURIComponent(src)}`,
  ];

  for (const proxyUrl of proxyCandidates) {
    try {
      const response = await fetch(proxyUrl);
      const contentType = response.headers.get("content-type") || "";

      // Strictly verify it's an image, not an SPA HTML fallback (text/html)
      if (response.ok && contentType.startsWith("image/")) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        return await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = (err) => {
            URL.revokeObjectURL(blobUrl);
            reject(err);
          };
          img.src = blobUrl;
        });
      }
    } catch {
      // Continue to next candidate
    }
  }

  // 4. Fallback: try image loading with crossOrigin
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      // If anonymous fails, try loading directly
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = (err) => reject(err);
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

/**
 * Formats wedding date for photobooth card footer (e.g. "13 DECEMBER 2025").
 */
export function formatPhotoboothDate(rawDate?: string | Date): string {
  if (!rawDate) return "";
  try {
    const d = new Date(rawDate);
    return d
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .toUpperCase();
  } catch {
    return "";
  }
}

/**
 * Composites a 1:1 square photo into a full wedding photobooth print card
 * at high resolution (with borders, typography, and card texture).
 */
export async function createPhotoboothComposite(
  imageSource: string | HTMLImageElement,
  wedding?: Wedding | null,
  options?: PhotoboothRenderOptions
): Promise<Blob> {
  const cardWidth = options?.width || 1600; // High resolution for crisp printing

  // Card proportions:
  // Margins: 7% of card width on left and right
  const margin = Math.round(cardWidth * 0.07);
  const photoSize = cardWidth - margin * 2; // 1:1 square photo size

  const topHeaderHeight = Math.round(margin * 0.7);
  const photoX = margin;
  const photoY = topHeaderHeight + Math.round(margin * 0.4);
  const chinStartY = photoY + photoSize;

  const coupleName =
    options?.coupleName || wedding?.name || "The Celebration Of Love";
  const dateStr =
    options?.weddingDate || formatPhotoboothDate(wedding?.date);

  // Fixed signature bar height below photo (snug to photo, aligned to right)
  const sigSlotHeight = Math.round(cardWidth * 0.038);
  const sigSlotY = chinStartY + Math.round(cardWidth * 0.002);

  // Calculate typography layout positions to determine exact card height
  const titleSpacing = Math.round(cardWidth * 0.052);
  const eyebrowY = sigSlotY + sigSlotHeight + Math.round(cardWidth * 0.024);
  const nameY = eyebrowY + titleSpacing;
  let currentY = nameY;

  let dateY: number | null = null;
  if (dateStr) {
    currentY = nameY + Math.round(cardWidth * 0.046);
    dateY = currentY;
  }

  let dividerY: number | null = null;
  let wishesY: number | null = null;
  let fromY: number | null = null;

  const hasExtraChin = Boolean(options?.wishes || options?.from);
  if (hasExtraChin) {
    currentY += Math.round(cardWidth * 0.024);
    dividerY = currentY;

    if (options?.wishes) {
      currentY += Math.round(cardWidth * 0.030);
      wishesY = currentY;
    }

    if (options?.from) {
      currentY += Math.round(cardWidth * 0.026);
      fromY = currentY;
    }
  }

  // Clean, balanced bottom margin (removes excess free space)
  const bottomPadding = Math.round(cardWidth * 0.045);
  const cardHeight = currentY + bottomPadding;

  const canvas = document.createElement("canvas");
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create canvas context");
  }

  // 1. Draw Card Background (#FFFCF8 - warm off-white/cream)
  ctx.fillStyle = "#FFFCF8";
  ctx.fillRect(0, 0, cardWidth, cardHeight);

  // Subtle outer border (#E7DED5)
  ctx.strokeStyle = "#E7DED5";
  ctx.lineWidth = Math.max(2, Math.round(cardWidth * 0.002));
  ctx.strokeRect(1, 1, cardWidth - 2, cardHeight - 2);

  // 2. Draw Top Micro Branding ("FOTOBOOTH KITA")
  const brandText = options?.watermark || "FOTOBOOTH KITA";
  ctx.fillStyle = "rgba(122, 112, 105, 0.6)"; // #7A7069 with opacity
  ctx.font = `500 ${Math.round(cardWidth * 0.015)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "4px";
  ctx.fillText(brandText, cardWidth / 2, Math.round(topHeaderHeight * 0.7));

  // 3. Draw 1:1 Square Photo
  const img =
    typeof imageSource === "string" ? await loadImage(imageSource) : imageSource;

  // Background for photo frame
  ctx.fillStyle = "#F8F5F0";
  ctx.fillRect(photoX, photoY, photoSize, photoSize);

  // Draw image cropped to 1:1 square
  const srcMinDim = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const srcX = ((img.naturalWidth || img.width) - srcMinDim) / 2;
  const srcY = ((img.naturalHeight || img.height) - srcMinDim) / 2;

  ctx.drawImage(
    img,
    srcX,
    srcY,
    srcMinDim,
    srcMinDim,
    photoX,
    photoY,
    photoSize,
    photoSize
  );

  // Inner photo border (#E7DED5 / thin frame)
  ctx.strokeStyle = "rgba(231, 222, 213, 0.9)";
  ctx.lineWidth = Math.max(1, Math.round(cardWidth * 0.0015));
  ctx.strokeRect(photoX, photoY, photoSize, photoSize);

  // 4. Draw Signature BELOW the photo (snug to bottom, right aligned)
  if (options?.signature) {
    const parsed = parseSignature(options.signature);
    if (parsed) {
      const sigRight = photoX + photoSize;

      if (parsed.type === "image") {
        try {
          const sigImg = await loadImage(parsed.data);
          const trimmed = trimImageBoundingBox(sigImg);
          const source = trimmed ? trimmed.canvas : sigImg;
          const imgW = trimmed ? trimmed.width : (sigImg.naturalWidth || sigImg.width);
          const imgH = trimmed ? trimmed.height : (sigImg.naturalHeight || sigImg.height);
          const sigHeight = sigSlotHeight;
          const sigWidth = (imgW / imgH) * sigHeight;

          const color =
            parsed.color &&
            !["#ffffff", "#fff", "#faf5ef"].includes(parsed.color.toLowerCase())
              ? parsed.color
              : "#2F2926";

          // Draw signature with dashes: "- [sig] -"
          ctx.fillStyle = color;
          ctx.font = `normal ${Math.round(cardWidth * 0.036)}px "Alex Brush", "Great Vibes", "Brush Script MT", cursive`;
          ctx.textBaseline = "middle";
          const dashWidth = ctx.measureText("-").width;
          const dashGap = Math.round(cardWidth * 0.005);
          const totalWidth = dashWidth + dashGap + sigWidth + dashGap + dashWidth;
          const startX = sigRight - totalWidth;
          const centerY = sigSlotY + sigHeight / 2;

          ctx.textAlign = "left";
          ctx.fillText("-", startX, centerY);
          ctx.drawImage(source, startX + dashWidth + dashGap, sigSlotY, sigWidth, sigHeight);
          ctx.fillText("-", startX + dashWidth + dashGap + sigWidth + dashGap, centerY);
          ctx.textAlign = "center";
        } catch {
          // fallback if signature image fails to draw
        }
      } else {
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        const color =
          parsed.color &&
          !["#ffffff", "#fff", "#faf5ef"].includes(parsed.color.toLowerCase())
            ? parsed.color
            : "#2F2926";
        ctx.fillStyle = color;
        ctx.font = `normal ${Math.round(cardWidth * 0.036)}px "Alex Brush", "Great Vibes", "Brush Script MT", cursive`;
        ctx.letterSpacing = "0px";
        ctx.fillText(parsed.data, sigRight, sigSlotY);
        ctx.textAlign = "center";
      }
    }
  }

  // 5. Draw Photobooth Bottom Chin Typography
  // Try to ensure custom fonts are loaded
  try {
    await document.fonts.ready;
  } catch {
    // Continue with system fallbacks
  }

  ctx.textAlign = "center";

  // Eyebrow: "THE WEDDING OF"
  ctx.fillStyle = "#7A7069";
  ctx.font = `500 ${Math.round(cardWidth * 0.018)}px Inter, system-ui, sans-serif`;
  ctx.letterSpacing = "6px";
  ctx.fillText("THE WEDDING OF", cardWidth / 2, eyebrowY);

  // Couple Name: in Cormorant Garamond
  ctx.fillStyle = "#2F2926";
  const nameFontSize = Math.round(cardWidth * 0.042);
  ctx.font = `normal ${nameFontSize}px "Cormorant Garamond", Georgia, serif`;
  ctx.letterSpacing = "3px";
  ctx.fillText(coupleName.toUpperCase(), cardWidth / 2, nameY);

  // Date
  if (dateY && dateStr) {
    ctx.fillStyle = "#7A7069";
    ctx.font = `normal ${Math.round(cardWidth * 0.014)}px Inter, system-ui, sans-serif`;
    ctx.letterSpacing = "4px";
    ctx.fillText(dateStr, cardWidth / 2, dateY);
  }

  // Wishes & Prayers
  if (dividerY) {
    // Small divider line
    ctx.strokeStyle = "#E7DED5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardWidth * 0.35, dividerY);
    ctx.lineTo(cardWidth * 0.65, dividerY);
    ctx.stroke();
  }

  if (wishesY && options?.wishes) {
    ctx.fillStyle = "#433B37";
    ctx.font = `italic ${Math.round(cardWidth * 0.02)}px "Cormorant Garamond", Georgia, serif`;
    ctx.letterSpacing = "1px";
    const cleanWishes = options.wishes.length > 90
      ? `"${options.wishes.slice(0, 87)}..."`
      : `"${options.wishes}"`;
    ctx.fillText(cleanWishes, cardWidth / 2, wishesY);
  }

  if (fromY && options?.from) {
    ctx.fillStyle = "#7A7069";
    ctx.font = `500 ${Math.round(cardWidth * 0.015)}px Inter, system-ui, sans-serif`;
    ctx.letterSpacing = "2px";
    ctx.fillText(`— WITH LOVE, ${options.from.toUpperCase()}`, cardWidth / 2, fromY);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export photobooth canvas"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.96
    );
  });
}

/**
 * Downloads a photobooth composite print directly to the user's device.
 */
export async function downloadPhotoboothCard(
  imageUrl: string,
  wedding?: Wedding | null,
  filename?: string,
  options?: PhotoboothRenderOptions
): Promise<void> {
  const blob = await createPhotoboothComposite(imageUrl, wedding, options);
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanName = (wedding?.name || "wedding")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const baseName = filename ? filename.replace(/\.[^/.]+$/, "") : "print";
  link.download = `${cleanName}-${baseName}-photobooth.jpg`;
  link.href = downloadUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
}
