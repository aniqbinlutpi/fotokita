import React, { useEffect, useRef, useState } from "react";
import { Music, VolumeX } from "lucide-react";
import type { CardPalette } from "@/lib/themes";

interface Props {
  src: string;
  /** Flips to true once the guest has tapped "Buka" (browsers block autoplay before that) */
  start: boolean;
  palette: CardPalette;
}

export const MusicToggle: React.FC<Props> = ({ src, start, palette }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!start) return;
    audioRef.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [start]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Jeda muzik" : "Mainkan muzik"}
        className="fixed bottom-5 right-5 z-40 rounded-full p-3 shadow-lg transition active:scale-95"
        style={{ background: palette.deep, color: palette.paper }}
      >
        {playing ? <Music size={18} className="animate-pulse" /> : <VolumeX size={18} />}
      </button>
    </>
  );
};
