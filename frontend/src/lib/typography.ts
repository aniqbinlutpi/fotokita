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
export const AMPERSAND_SIZE_CONFIG: NumericSizeConfig = { min: 40, max: 800, step: 10, defaultValue: 380 };
export const ORB_SIZE_CONFIG: NumericSizeConfig = { min: 30, max: 400, step: 5, defaultValue: 130 };

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

export function parseAmpersandSize(sizeStr?: string): number {
  if (!sizeStr) return 380;
  const num = parseInt(sizeStr, 10);
  if (!isNaN(num) && num > 0) return num;
  return 380;
}

export function parseOrbSize(sizeStr?: string): number {
  if (!sizeStr) return 130;
  const num = parseInt(sizeStr, 10);
  if (!isNaN(num) && num > 0) return num;
  return 130;
}

// Dynamic CSS style generators ensuring typography matches user setting and scales gracefully on mobile
export function getPartnerFontSizeStyle(
  sizeStr?: string,
  deviceView?: "full" | "mobile" | "tablet"
): { fontSize: string } {
  const base = parsePartnerSize(sizeStr);
  if (deviceView === "mobile") {
    // Proportional mobile size: scaled down so names don't wrap or collide
    const mobileSize = Math.max(24, Math.min(42, Math.round(base * 0.52)));
    return { fontSize: `${mobileSize}px` };
  }
  if (deviceView === "tablet") {
    const tabletSize = Math.max(32, Math.min(60, Math.round(base * 0.8)));
    return { fontSize: `${tabletSize}px` };
  }
  return { fontSize: `${base}px` };
}

export function getEyebrowFontSizeStyle(
  sizeStr?: string,
  deviceView?: "full" | "mobile" | "tablet"
): { fontSize: string } {
  const base = parseEyebrowSize(sizeStr);
  if (deviceView === "mobile") {
    const mobileSize = Math.max(9, Math.min(11, Math.round(base * 0.85)));
    return { fontSize: `${mobileSize}px` };
  }
  return { fontSize: `${base}px` };
}

export function getDateFontSizeStyle(
  sizeStr?: string,
  deviceView?: "full" | "mobile" | "tablet"
): { fontSize: string } {
  const base = parseDateSize(sizeStr);
  if (deviceView === "mobile") {
    const mobileSize = Math.max(10, Math.min(12, Math.round(base * 0.85)));
    return { fontSize: `${mobileSize}px` };
  }
  return { fontSize: `${base}px` };
}

export function getQuoteFontSizeStyle(
  sizeStr?: string,
  deviceView?: "full" | "mobile" | "tablet"
): { fontSize: string } {
  const base = parseQuoteSize(sizeStr);
  if (deviceView === "mobile") {
    const mobileSize = Math.max(13, Math.min(16, Math.round(base * 0.85)));
    return { fontSize: `${mobileSize}px` };
  }
  return { fontSize: `${base}px` };
}

export function getAmpersandFontSizeStyle(
  sizeStr?: string,
  deviceView?: "full" | "mobile" | "tablet"
): { fontSize: string } {
  const base = parseAmpersandSize(sizeStr);
  if (deviceView === "mobile") {
    // Desktop default is 380px. On mobile, scale down to elegant 110px-130px range
    const mobileSize = Math.max(70, Math.min(130, Math.round(base * 0.32)));
    return { fontSize: `${mobileSize}px` };
  }
  if (deviceView === "tablet") {
    const tabletSize = Math.max(160, Math.min(260, Math.round(base * 0.65)));
    return { fontSize: `${tabletSize}px` };
  }
  return { fontSize: `${base}px` };
}

