import type { Wedding } from "@/types/wedding";

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
 * Routes remote URLs through proxy as a local blob to guarantee clean canvas exports without CORS taint.
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  // If already a local blob or data URL, load directly
  if (src.startsWith("blob:") || src.startsWith("data:")) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  // For remote URLs (e.g. S3 presigned URLs), route through our proxy to avoid S3 CORS blocks
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Proxy returned status ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      };
      img.src = blobUrl;
    });
  } catch (proxyError) {
    console.warn("Proxy load failed, falling back to direct image loading:", proxyError);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }
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
  // Margins: 6.5% of card width on top, left, right
  const margin = Math.round(cardWidth * 0.07);
  const photoSize = cardWidth - margin * 2; // 1:1 square photo size

  // Bottom chin: expandable for wishes/guestbook signature
  const hasExtraChin = Boolean(options?.wishes || options?.from || options?.signature);
  const topHeaderHeight = Math.round(margin * 0.7);
  const bottomChinHeight = Math.round(cardWidth * (hasExtraChin ? 0.38 : 0.26));
  const cardHeight = topHeaderHeight + margin + photoSize + bottomChinHeight;

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

  // 2. Draw Top Micro Branding ("FOTOKITA PHOTOBOOTH")
  const brandText = options?.watermark || "FOTOKITA PHOTOBOOTH";
  ctx.fillStyle = "rgba(122, 112, 105, 0.6)"; // #7A7069 with opacity
  ctx.font = `500 ${Math.round(cardWidth * 0.015)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "4px";
  ctx.fillText(brandText, cardWidth / 2, Math.round(topHeaderHeight * 0.7));

  // 3. Draw 1:1 Square Photo
  const img =
    typeof imageSource === "string" ? await loadImage(imageSource) : imageSource;

  const photoX = margin;
  const photoY = topHeaderHeight + Math.round(margin * 0.4);

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

  // 4. Draw Photobooth Bottom Chin Typography
  const coupleName =
    options?.coupleName || wedding?.name || "The Celebration Of Love";
  const dateStr =
    options?.weddingDate || formatPhotoboothDate(wedding?.date);

  // Try to ensure custom fonts are loaded
  try {
    await document.fonts.ready;
  } catch {
    // Continue with system fallbacks
  }

  const chinStartY = photoY + photoSize;
  ctx.textAlign = "center";

  // Eyebrow: "THE WEDDING OF"
  ctx.fillStyle = "#7A7069";
  ctx.font = `500 ${Math.round(cardWidth * 0.018)}px Inter, system-ui, sans-serif`;
  ctx.letterSpacing = "6px";
  const eyebrowY = chinStartY + Math.round(cardWidth * 0.06);
  ctx.fillText("THE WEDDING OF", cardWidth / 2, eyebrowY);

  // Couple Name: in Cormorant Garamond
  ctx.fillStyle = "#2F2926";
  const nameFontSize = Math.round(cardWidth * 0.042);
  ctx.font = `normal ${nameFontSize}px "Cormorant Garamond", Georgia, serif`;
  ctx.letterSpacing = "3px";
  const nameY = eyebrowY + Math.round(cardWidth * 0.065);
  ctx.fillText(coupleName.toUpperCase(), cardWidth / 2, nameY);

  // Date
  let currentY = nameY;
  if (dateStr) {
    ctx.fillStyle = "#7A7069";
    ctx.font = `normal ${Math.round(cardWidth * 0.016)}px Inter, system-ui, sans-serif`;
    ctx.letterSpacing = "4px";
    currentY = nameY + Math.round(cardWidth * 0.042);
    ctx.fillText(dateStr, cardWidth / 2, currentY);
  }

  // Wishes & Prayers & Signature if provided
  if (hasExtraChin) {
    // Small divider line
    currentY += Math.round(cardWidth * 0.035);
    ctx.strokeStyle = "#E7DED5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardWidth * 0.35, currentY);
    ctx.lineTo(cardWidth * 0.65, currentY);
    ctx.stroke();

    // Wishes
    if (options?.wishes) {
      currentY += Math.round(cardWidth * 0.04);
      ctx.fillStyle = "#433B37";
      ctx.font = `italic ${Math.round(cardWidth * 0.02)}px "Cormorant Garamond", Georgia, serif`;
      ctx.letterSpacing = "1px";
      const cleanWishes = options.wishes.length > 90
        ? `"${options.wishes.slice(0, 87)}..."`
        : `"${options.wishes}"`;
      ctx.fillText(cleanWishes, cardWidth / 2, currentY);
    }

    // From name
    if (options?.from) {
      currentY += Math.round(cardWidth * 0.035);
      ctx.fillStyle = "#7A7069";
      ctx.font = `500 ${Math.round(cardWidth * 0.015)}px Inter, system-ui, sans-serif`;
      ctx.letterSpacing = "2px";
      ctx.fillText(`— WITH LOVE, ${options.from.toUpperCase()}`, cardWidth / 2, currentY);
    }

    // Signature
    if (options?.signature) {
      if (options.signature.startsWith("data:image/")) {
        try {
          const sigImg = await loadImage(options.signature);
          const sigHeight = Math.round(cardWidth * 0.045);
          const sigWidth = (sigImg.naturalWidth / sigImg.naturalHeight) * sigHeight;
          const sigX = (cardWidth - sigWidth) / 2;
          currentY += Math.round(cardWidth * 0.015);
          ctx.drawImage(sigImg, sigX, currentY, sigWidth, sigHeight);
        } catch {
          // fallback if signature image fails to draw
        }
      } else {
        currentY += Math.round(cardWidth * 0.04);
        ctx.fillStyle = "#2F2926";
        ctx.font = `normal ${Math.round(cardWidth * 0.045)}px "Alex Brush", "Great Vibes", "Brush Script MT", cursive`;
        ctx.fillText(options.signature, cardWidth / 2, currentY);
      }
    }
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
