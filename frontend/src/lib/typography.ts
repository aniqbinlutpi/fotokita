export interface WeddingFontOption {
  id: string;
  name: string;
  category: "serif" | "script" | "sans";
  description: string;
  cssFamily: string;
}

export const WEDDING_FONT_OPTIONS: WeddingFontOption[] = [
  // Editorial & Regal Serifs
  {
    id: "cormorant",
    name: "Cormorant Garamond",
    category: "serif",
    description: "Classic Royal Editorial Serif",
    cssFamily: "'Cormorant Garamond', Georgia, serif",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    category: "serif",
    description: "High-Contrast Modern Serif",
    cssFamily: "'Playfair Display', Georgia, serif",
  },
  {
    id: "cinzel",
    name: "Cinzel",
    category: "serif",
    description: "Noble Roman Inscriptional Serif",
    cssFamily: "'Cinzel', 'Times New Roman', serif",
  },
  {
    id: "bodoni",
    name: "Bodoni Moda",
    category: "serif",
    description: "Haute-Couture Vogue Luxury Serif",
    cssFamily: "'Bodoni Moda', 'Didot', Georgia, serif",
  },

  // Romantic Calligraphy & Hand Scripts
  {
    id: "great-vibes",
    name: "Great Vibes",
    category: "script",
    description: "Sweeping Calligraphy Flourish Script",
    cssFamily: "'Great Vibes', cursive",
  },
  {
    id: "alex-brush",
    name: "Alex Brush",
    category: "script",
    description: "Flowing Romantic Brush Cursive",
    cssFamily: "'Alex Brush', cursive",
  },
  {
    id: "pinyon-script",
    name: "Pinyon Script",
    category: "script",
    description: "Vintage French Aristocratic Calligraphy",
    cssFamily: "'Pinyon Script', cursive",
  },
  {
    id: "parisienne",
    name: "Parisienne",
    category: "script",
    description: "Airy French Romance Cursive",
    cssFamily: "'Parisienne', cursive",
  },

  // Modernist Clean Minimal Sans
  {
    id: "montserrat",
    name: "Montserrat",
    category: "sans",
    description: "Geometric Modern Luxury Sans",
    cssFamily: "'Montserrat', sans-serif",
  },
  {
    id: "inter",
    name: "Inter",
    category: "sans",
    description: "Crisp Swiss Clean Modernist Sans",
    cssFamily: "'Inter', sans-serif",
  },
];

export const FONT_MAP = new Map<string, WeddingFontOption>(
  WEDDING_FONT_OPTIONS.map((f) => [f.id, f])
);

export function getFontFamilyCss(fontId?: string, fallback = "'Cormorant Garamond', Georgia, serif"): string {
  if (!fontId) return fallback;
  return FONT_MAP.get(fontId)?.cssFamily || fallback;
}

// Numeric size configurations for flexible typography adjustments
export interface NumericSizeConfig {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export const PARTNER_SIZE_CONFIG: NumericSizeConfig = { min: 10, max: 200, step: 1, defaultValue: 72 };
export const EYEBROW_SIZE_CONFIG: NumericSizeConfig = { min: 6, max: 60, step: 1, defaultValue: 12 };
export const DATE_SIZE_CONFIG: NumericSizeConfig = { min: 6, max: 60, step: 1, defaultValue: 13 };
export const QUOTE_SIZE_CONFIG: NumericSizeConfig = { min: 8, max: 100, step: 1, defaultValue: 18 };

// Parsers with backward-compatibility for legacy presets ("sm", "normal", "lg", "xl")
export function parsePartnerSize(sizeStr?: string): number {
  if (!sizeStr) return 72;
  const num = parseInt(sizeStr, 10);
  if (!isNaN(num) && num > 0) return num;
  if (sizeStr === "sm") return 54;
  if (sizeStr === "lg") return 84;
  if (sizeStr === "xl") return 98;
  return 72;
}

export function parseEyebrowSize(sizeStr?: string): number {
  if (!sizeStr) return 12;
  const num = parseInt(sizeStr, 10);
  if (!isNaN(num) && num > 0) return num;
  if (sizeStr === "sm") return 10;
  if (sizeStr === "lg") return 15;
  return 12;
}

export function parseDateSize(sizeStr?: string): number {
  if (!sizeStr) return 13;
  const num = parseInt(sizeStr, 10);
  if (!isNaN(num) && num > 0) return num;
  if (sizeStr === "sm") return 11;
  if (sizeStr === "lg") return 16;
  return 13;
}

export function parseQuoteSize(sizeStr?: string): number {
  if (!sizeStr) return 18;
  const num = parseInt(sizeStr, 10);
  if (!isNaN(num) && num > 0) return num;
  if (sizeStr === "sm") return 14;
  if (sizeStr === "lg") return 22;
  if (sizeStr === "xl") return 26;
  return 18;
}

// Dynamic CSS style generators ensuring typography matches user setting exactly across F12, real mobile, and preview
export function getPartnerFontSizeStyle(
  sizeStr?: string,
  _deviceView?: "full" | "mobile" | "tablet"
): { fontSize: string } {
  const base = parsePartnerSize(sizeStr);
  return { fontSize: `${base}px` };
}

export function getEyebrowFontSizeStyle(
  sizeStr?: string,
  _deviceView?: "full" | "mobile" | "tablet"
): { fontSize: string } {
  const base = parseEyebrowSize(sizeStr);
  return { fontSize: `${base}px` };
}

export function getDateFontSizeStyle(
  sizeStr?: string,
  _deviceView?: "full" | "mobile" | "tablet"
): { fontSize: string } {
  const base = parseDateSize(sizeStr);
  return { fontSize: `${base}px` };
}

export function getQuoteFontSizeStyle(
  sizeStr?: string,
  _deviceView?: "full" | "mobile" | "tablet"
): { fontSize: string } {
  const base = parseQuoteSize(sizeStr);
  return { fontSize: `${base}px` };
}
