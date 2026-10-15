export interface CardPalette {
  paper: string;
  ink: string;
  accent: string;
  soft: string;
  deep: string;
}

// Mirrors the orb colours of `themePresets` in WeddingHeroDesktop/Mobile (brickA..E)
export const CARD_PALETTES: Record<string, CardPalette> = {
  warmGold: { deep: "#1F1712", ink: "#4A3728", accent: "#8C6D48", soft: "#C9AA7C", paper: "#F5EADB" },
  roseRomance: { deep: "#280D16", ink: "#541C2C", accent: "#9C435A", soft: "#DFA4AF", paper: "#FDF2F4" },
  emerald: { deep: "#0D211A", ink: "#1A4335", accent: "#3D7A65", soft: "#94C9B4", paper: "#E8F5F0" },
  midnight: { deep: "#0A0E17", ink: "#152238", accent: "#4F678F", soft: "#B2C4DF", paper: "#F0F4FA" },
};

export function getCardPalette(name?: string): CardPalette {
  return CARD_PALETTES[name ?? ""] ?? CARD_PALETTES.warmGold!;
}
