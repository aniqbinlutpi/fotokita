export interface ParsedSignature {
  type: "image" | "text";
  data: string;
  color?: string;
}

export interface SignatureColorOption {
  label: string;
  value: string;
  border?: string;
}

export const SIGNATURE_COLOR_PRESETS: SignatureColorOption[] = [
  { label: "Charcoal", value: "#2F2926", border: "#1C1917" },
  { label: "Warm Bronze", value: "#A67C6B", border: "#8C6555" },
  { label: "Gold", value: "#D4AF37", border: "#B89628" },
  { label: "Muted Grey", value: "#7A7069", border: "#574E47" },
  { label: "Navy", value: "#1B2A4A", border: "#101B33" },
];

export const DEFAULT_SIGNATURE_COLOR = "#2F2926";

/**
 * Formats a typed signature by wrapping it in dashes, e.g. "idris" -> "- idris -".
 * Avoids duplicate dashes if already typed.
 */
export function formatTypedSignature(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const withoutDashes = trimmed.replace(/^[-–—\s]+|[-–—\s]+$/g, "").trim();
  if (!withoutDashes) return trimmed;
  return `- ${withoutDashes} -`;
}

/**
 * Parses raw signature data (dataURL, JSON string, or plain text) into a structured object.
 */
export function parseSignature(
  signature?: string | null
): ParsedSignature | null {
  if (!signature || !signature.trim()) return null;
  const trimmed = signature.trim();

  // If it's a base64 image from canvas draw
  if (trimmed.startsWith("data:image/")) {
    return { type: "image", data: trimmed };
  }

  // If it's JSON formatted { text, color } or { image, color }
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.image === "string" && parsed.image.trim()) {
        const rawColor = typeof parsed.color === "string" ? parsed.color : DEFAULT_SIGNATURE_COLOR;
        return {
          type: "image",
          data: parsed.image.trim(),
          color: rawColor,
        };
      }
      if (
        typeof parsed.text === "string" &&
        parsed.text.trim()
      ) {
        const rawColor = typeof parsed.color === "string" ? parsed.color : DEFAULT_SIGNATURE_COLOR;
        const isTooLight = ["#ffffff", "#fff", "#faf5ef"].includes(rawColor.toLowerCase());
        return {
          type: "text",
          data: formatTypedSignature(parsed.text),
          color: isTooLight ? DEFAULT_SIGNATURE_COLOR : rawColor,
        };
      }
    }
  } catch {
    // Plain text string fallback
  }

  return {
    type: "text",
    data: formatTypedSignature(trimmed),
    color: DEFAULT_SIGNATURE_COLOR,
  };
}

/**
 * Crops a signature canvas to the bounding box of non-transparent pixels.
 */
export function cropSignatureCanvas(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/png");

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasInk = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasInk = true;
      }
    }
  }

  if (!hasInk) return "";

  // Add small padding around ink
  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) return canvas.toDataURL("image/png");

  croppedCtx.drawImage(
    canvas,
    minX,
    minY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  return croppedCanvas.toDataURL("image/png");
}

/**
 * Trims an HTMLImageElement to the bounding box of non-transparent pixels.
 */
export function trimImageBoundingBox(
  img: HTMLImageElement
): { canvas: HTMLCanvasElement; width: number; height: number } | null {
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;
  if (!imgWidth || !imgHeight) return null;

  const temp = document.createElement("canvas");
  temp.width = imgWidth;
  temp.height = imgHeight;
  const ctx = temp.getContext("2d");
  if (!ctx) return null;

  try {
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, imgWidth, imgHeight);
    const data = imgData.data;

    let minX = imgWidth;
    let minY = imgHeight;
    let maxX = 0;
    let maxY = 0;
    let hasInk = false;

    for (let y = 0; y < imgHeight; y++) {
      for (let x = 0; x < imgWidth; x++) {
        const alpha = data[(y * imgWidth + x) * 4 + 3];
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasInk = true;
        }
      }
    }

    if (!hasInk) return null;

    const pad = 2;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(imgWidth - 1, maxX + pad);
    maxY = Math.min(imgHeight - 1, maxY + pad);

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;

    const cropped = document.createElement("canvas");
    cropped.width = cropWidth;
    cropped.height = cropHeight;
    const cctx = cropped.getContext("2d");
    if (!cctx) return null;

    cctx.drawImage(
      temp,
      minX,
      minY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return { canvas: cropped, width: cropWidth, height: cropHeight };
  } catch {
    return null;
  }
}
