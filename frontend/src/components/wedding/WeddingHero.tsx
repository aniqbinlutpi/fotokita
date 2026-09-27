import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, Calendar, Camera } from "lucide-react";
import type { Wedding } from "@/types/wedding";

interface WeddingHeroProps {
  wedding: Wedding | null;
  photoCount: number;
  onOpenUpload: () => void;
}

export const WeddingHero: React.FC<WeddingHeroProps> = ({
  wedding,
  photoCount,
  onOpenUpload,
}) => {
  const formattedDate = React.useMemo(() => {
    if (!wedding?.date) return "";
    try {
      const d = new Date(wedding.date);
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, [wedding]);

  return (
    <header className="relative pt-12 pb-10 md:pt-20 md:pb-16 px-6 max-w-5xl mx-auto text-center">
      {/* Editorial eyebrow */}
      <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.25em] text-[#7A7069] mb-4">
        <span className="w-6 h-px bg-[#E7DED5]" />
        <span>Wedding Archive</span>
        <span className="w-6 h-px bg-[#E7DED5]" />
      </div>

      {/* Couple Name / Title in Cormorant Garamond */}
      <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal text-[#2F2926] tracking-tight leading-[1.1] mb-4">
        {wedding?.name ?? "The Celebration of Love"}
      </h1>

      {/* Date & Meta Details */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm text-[#7A7069] mb-8 font-sans">
        {formattedDate && (
          <div className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5 text-[#A67C6B]" />
            <span>{formattedDate}</span>
          </div>
        )}
        <div className="inline-flex items-center gap-1.5">
          <Camera className="size-3.5 text-[#A67C6B]" />
          <span>
            {photoCount} {photoCount === 1 ? "Photograph" : "Photographs"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center max-w-xs mx-auto mb-8">
        <Separator className="bg-[#E7DED5]" />
      </div>

      {/* Hero CTA Button */}
      <div className="flex items-center justify-center">
        <Button
          onClick={onOpenUpload}
          variant="outline"
          className="border-[#E7DED5] bg-[#FFFCF8] text-[#2F2926] hover:bg-[#F8F5F0] hover:border-[#A67C6B] hover:text-[#2F2926] transition-colors duration-200 px-6 py-2.5 rounded-sm text-xs uppercase tracking-widest font-medium shadow-none gap-2 h-auto"
        >
          <UploadCloud className="size-3.5 text-[#A67C6B]" />
          <span>Contribute Memories</span>
        </Button>
      </div>
    </header>
  );
};
