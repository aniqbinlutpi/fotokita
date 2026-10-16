import React from "react";
import type { CardStyle } from "@/types/invitation";
import type { CardPalette } from "@/lib/themes";

const Corner: React.FC<{ color: string; className: string }> = ({ color, className }) => (
  <svg viewBox="0 0 100 100" className={`pointer-events-none absolute h-20 w-20 ${className}`} fill="none" stroke={color} strokeWidth="1.5" aria-hidden>
    <path d="M4 96 C4 40 40 4 96 4" />
    <path d="M4 70 C4 36 36 4 70 4" opacity=".6" />
    <circle cx="14" cy="14" r="5" fill={color} opacity=".35" />
    <path d="M30 14 q8 -10 16 0 q-8 10 -16 0z" fill={color} opacity=".3" />
    <path d="M14 30 q-10 8 0 16 q10 -8 0 -16z" fill={color} opacity=".3" />
  </svg>
);

export const InvitationFrame: React.FC<{ style: CardStyle; palette: CardPalette; children: React.ReactNode }> = ({
  style,
  palette,
  children,
}) => (
  <div className="relative mx-auto w-full max-w-md px-6 py-12 sm:rounded-3xl sm:shadow-2xl" style={{ background: palette.paper }}>
    {style === "classic" && (
      <div className="pointer-events-none absolute inset-3 rounded-2xl border-2" style={{ borderColor: palette.soft }}>
        <div className="absolute inset-1 rounded-xl border" style={{ borderColor: palette.accent + "88" }} />
      </div>
    )}
    {style === "floral" && (
      <>
        <Corner color={palette.accent} className="left-2 top-2" />
        <Corner color={palette.accent} className="right-2 top-2 rotate-90" />
        <Corner color={palette.accent} className="bottom-2 right-2 rotate-180" />
        <Corner color={palette.accent} className="bottom-2 left-2 -rotate-90" />
      </>
    )}
    <div className="relative space-y-12 px-2">{children}</div>
  </div>
);
