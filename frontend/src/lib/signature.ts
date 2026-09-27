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
  { label: "White", value: "#FFFFFF", border: "#D1D5DB" },
  { label: "Charcoal", value: "#2F2926", border: "#1C1917" },
  { label: "Gold", value: "#D4AF37", border: "#B89628" },
  { label: "Warm Bronze", value: "#A67C6B", border: "#8C6555" },
  { label: "Soft Cream", value: "#FAF5EF", border: "#E7DED5" },
];

export const DEFAULT_SIGNATURE_COLOR = "#FFFFFF";

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

  // If it's JSON formatted { text, color }
  try {
    const parsed = JSON.parse(trimmed);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.text === "string" &&
      parsed.text.trim()
    ) {
      return {
        type: "text",
        data: parsed.text.trim(),
        color: typeof parsed.color === "string" ? parsed.color : DEFAULT_SIGNATURE_COLOR,
      };
    }
  } catch {
    // Plain text string fallback
  }

  return {
    type: "text",
    data: trimmed,
    color: DEFAULT_SIGNATURE_COLOR,
  };
}
