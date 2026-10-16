import React from "react";
import { motion } from "motion/react";
import { Mail } from "lucide-react";
import type { CardPalette } from "@/lib/themes";

interface Props {
  partner1: string;
  partner2: string;
  dateText: string;
  palette: CardPalette;
  titleFont: string;
  onOpen: () => void;
}

export const InvitationCover: React.FC<Props> = ({ partner1, partner2, dateText, palette, titleFont, onOpen }) => (
  <motion.div
    className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-8 text-center"
    style={{ background: `radial-gradient(circle at 50% 30%, ${palette.ink}, ${palette.deep})`, color: palette.paper }}
    exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
  >
    <p className="text-xs uppercase tracking-[0.4em]" style={{ color: palette.soft }}>
      Jemputan Perkahwinan
    </p>
    <h1 className="text-6xl leading-tight" style={{ fontFamily: titleFont }}>
      {partner1}
      {partner2 && (
        <>
          <span className="block text-3xl" style={{ color: palette.soft }}>
            &amp;
          </span>
          {partner2}
        </>
      )}
    </h1>
    {dateText && <p className="text-sm tracking-widest opacity-80">{dateText}</p>}
    <button
      type="button"
      onClick={onOpen}
      className="mt-4 inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-medium transition active:scale-95"
      style={{ background: palette.soft, color: palette.deep }}
    >
      <Mail size={16} /> Buka Jemputan
    </button>
  </motion.div>
);
