import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  Eye,
  Smartphone,
  Heart,
  Camera,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FotokitaLogo } from "@/components/common/FotokitaLogo";
import loveHandwritingImg from "@/assets/images/love-handwritting.png";
import { toast } from "sonner";
import type { TenantCustomization } from "@/api/tenant";

export type StandeeCardSize = "a6" | "a5";
export type StandeeTheme = "classic-white" | "warm-ivory" | "soft-blush";

interface SubAdminTableQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestPublicUrl: string;
  customization: TenantCustomization;
  weddingName?: string;
  weddingDate?: string;
  uploadedPhotos?: { url: string; id?: string }[];
}

// Curated high-aesthetic wedding candid photos for the standee portrait photo templates
const DEFAULT_SAMPLE_PHOTOS = {
  couple:
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=500&q=80",
  celebration:
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=500&q=80",
};

const FOTOKITA_MINI_QR_URL =
  "https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=https%3A%2F%2Ffotokita.com";


interface StandeeCardInnerProps {
  cardSize: StandeeCardSize;
  cardTheme: StandeeTheme;
  partner1: string;
  partner2: string;
  formattedDate: string;
  qrCodeUrl: string;
  photoLeft: string;
  photoRight: string;
}

const StandeeCardInner: React.FC<StandeeCardInnerProps> = ({
  cardSize,
  cardTheme,
  partner1,
  partner2,
  formattedDate,
  qrCodeUrl,
  photoLeft,
  photoRight,
}) => {
  const isA5 = cardSize === "a5";

  return (
    <div
      style={{
        backgroundColor:
          cardTheme === "warm-ivory"
            ? "#FAF7F2"
            : cardTheme === "soft-blush"
            ? "#FAF4F2"
            : "#FFFFFF",
      }}
      className={`rounded-2xl border border-neutral-300/80 shadow-lg flex flex-col items-center justify-between text-neutral-900 relative transition-all duration-200 select-none overflow-hidden shrink-0 aspect-[1/1.414] ${
        isA5
          ? "w-full max-w-[280px] sm:max-w-[360px] md:max-w-[430px] p-3.5 sm:p-5 md:p-7 print-card-a5"
          : "w-full max-w-[260px] sm:max-w-[320px] md:max-w-[370px] p-3 sm:p-4.5 md:p-6 print-card-a6"
      }`}
    >
      {/* Decorative Outer & Inner Delicate Frames */}
      <div
        className={`absolute rounded-xl border border-neutral-300/70 pointer-events-none ${
          isA5 ? "inset-2 sm:inset-3 md:inset-4" : "inset-1.5 sm:inset-2.5 md:inset-3"
        }`}
      />
      <div
        className={`absolute rounded-lg border border-neutral-300/40 pointer-events-none ${
          isA5 ? "inset-3 sm:inset-4.5 md:inset-5.5" : "inset-2.5 sm:inset-3.5 md:inset-4"
        }`}
      />

      {/* Main Centered Content Wrapper: Evenly distributed from top to bottom */}
      <div className="w-full flex-1 flex flex-col items-center justify-evenly z-10 py-1 sm:py-2 md:py-3">
        {/* 1. Header: S H A R E — the love — with fotokita.com */}
        <div className="w-full text-center relative z-10">
          <h4
            className={`font-semibold tracking-[0.28em] text-neutral-800 uppercase font-sans ${
              isA5 ? "text-[9px] sm:text-xs md:text-sm" : "text-[8px] sm:text-[10px] md:text-xs"
            }`}
          >
            S H A R E
          </h4>

          {/* Decorative Horizontal Rule & Calligraphy: Wedding style cursive "the love" */}
          <div className="relative flex items-center justify-center my-0.5 sm:my-1">
            <div className="absolute inset-x-2 sm:inset-x-4 md:inset-x-5 h-px bg-neutral-300" />
            <span
              className={`relative px-2 sm:px-3 text-neutral-900 font-normal leading-none tracking-wide ${
                isA5
                  ? "text-3xl sm:text-5xl md:text-6xl print:text-[54px]"
                  : "text-2xl sm:text-4xl md:text-5xl print:text-[44px]"
              }`}
              style={{
                fontFamily: "'Alex Brush', 'Great Vibes', 'Parisienne', cursive",
                backgroundColor:
                  cardTheme === "warm-ivory"
                    ? "#FAF7F2"
                    : cardTheme === "soft-blush"
                    ? "#FAF4F2"
                    : "#FFFFFF",
              }}
            >
              the love
            </span>
          </div>

          {/* Action Tagline */}
          <p
            className={`font-bold tracking-[0.14em] text-neutral-800 uppercase font-sans ${
              isA5
                ? "text-[11px] sm:text-sm md:text-base print:text-[14px] mt-1 sm:mt-2 md:mt-2.5"
                : "text-[9.5px] sm:text-xs md:text-sm print:text-[12px] mt-1 sm:mt-1.5 md:mt-2"
            }`}
          >
            SHARE YOUR PHOTOS WITH US!
          </p>
          <p
            className={`font-medium tracking-[0.12em] text-neutral-500 uppercase font-sans mt-0.5 sm:mt-1 ${
              isA5
                ? "text-[9px] sm:text-xs md:text-sm print:text-[11px]"
                : "text-[8px] sm:text-[10px] md:text-xs print:text-[9.5px]"
            }`}
          >
            SIMPLY SCAN THE QR CODE AND UPLOAD
          </p>
        </div>

        {/* 2. Centerpiece: Main QR Code (In front) + 2 Flanking Portrait Photos (Behind & blurred) */}
        <div className="relative w-full flex items-center justify-center z-10 px-1 sm:px-2 bg-transparent select-none">
          {/* Left Portrait Photo Template (Snap photo) - Behind QR & softly blurred */}
          <div
            className={`-rotate-8 bg-white p-0.5 sm:p-1 rounded-md sm:rounded-lg border border-neutral-200/90 shrink-0 transition-transform hover:scale-105 z-0 photo-left-polaroid select-none ${
              isA5
                ? "w-14 sm:w-20 md:w-26 -mr-4 sm:-mr-6 md:-mr-8"
                : "w-12 sm:w-16 md:w-22 -mr-3 sm:-mr-5 md:-mr-7"
            }`}
          >
            <div className="aspect-[3/4] w-full rounded-xs sm:rounded-md overflow-hidden bg-white border border-neutral-200/60 select-none">
              <img
                src={photoLeft}
                alt="Candid couple upload example"
                draggable={false}
                className="w-full h-full object-cover select-none pointer-events-none blur-[1.5px] scale-105"
              />
            </div>
            <div className="pt-0.5 text-center select-none">
              <span
                className={`font-sans font-medium text-neutral-600 tracking-tight flex items-center justify-center gap-0.5 sm:gap-1 ${
                  isA5
                    ? "text-[6px] sm:text-[8px] md:text-[9px]"
                    : "text-[5.5px] sm:text-[7px] md:text-[8px]"
                }`}
              >
                <Camera className="size-1.5 sm:size-2 text-neutral-500 shrink-0" />
                <span>Snap photo</span>
              </span>
            </div>
          </div>

          {/* Center Main QR Code (In front with solid bg, crisp border & delicate shadow) */}
          <div
            className={`bg-white rounded-lg sm:rounded-xl border border-neutral-200/90 relative z-10 shadow-lg shadow-neutral-900/10 flex flex-col items-center justify-center shrink-0 select-none ${
              isA5 ? "p-1.5 sm:p-2.5 md:p-3.5" : "p-1.5 sm:p-2 md:p-3"
            }`}
          >
            <img
              src={qrCodeUrl}
              alt="Scan QR code to upload photos"
              draggable={false}
              className={`object-contain rounded-xs main-qr-img select-none pointer-events-none ${
                isA5
                  ? "size-26 sm:size-38 md:size-48"
                  : "size-22 sm:size-32 md:size-40"
              }`}
            />
          </div>

          {/* Right Portrait Photo Template (Share joy) - Behind QR & softly blurred */}
          <div
            className={`rotate-8 bg-white p-0.5 sm:p-1 rounded-md sm:rounded-lg border border-neutral-200/90 shrink-0 transition-transform hover:scale-105 z-0 photo-right-polaroid select-none ${
              isA5
                ? "w-14 sm:w-20 md:w-26 -ml-4 sm:-ml-6 md:-ml-8"
                : "w-12 sm:w-16 md:w-22 -ml-3 sm:-ml-5 md:-ml-7"
            }`}
          >
            <div className="aspect-[3/4] w-full rounded-xs sm:rounded-md overflow-hidden bg-white border border-neutral-200/60 select-none">
              <img
                src={photoRight}
                alt="Guest celebration upload example"
                draggable={false}
                className="w-full h-full object-cover select-none pointer-events-none blur-[1.5px] scale-105"
              />
            </div>
            <div className="pt-0.5 text-center select-none">
              <span
                className={`font-sans font-medium text-neutral-600 tracking-tight flex items-center justify-center gap-0.5 sm:gap-1 ${
                  isA5
                    ? "text-[6px] sm:text-[8px] md:text-[9px]"
                    : "text-[5.5px] sm:text-[7px] md:text-[8px]"
                }`}
              >
                <Heart className="size-1.5 sm:size-2 text-rose-500 fill-rose-500 shrink-0" />
                <span>Share joy</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. Who love Who & Wedding Date: Larger marriage names & love artwork */}
        <div className="w-full text-center relative z-10 select-none">
          <h5
            className={`font-normal text-neutral-900 leading-none flex items-center justify-center gap-2 sm:gap-3 md:gap-4 ${
              isA5
                ? "text-xl sm:text-3xl md:text-5xl print:text-[34px]"
                : "text-lg sm:text-2xl md:text-4xl print:text-[28px]"
            }`}
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <span className="italic font-normal tracking-tight">
              {partner1}
            </span>
            <img
              src={loveHandwritingImg}
              alt="love"
              draggable={false}
              className={`inline-block object-contain select-none pointer-events-none shrink-0 -translate-x-0.5 sm:-translate-x-1 md:-translate-x-1.5 ${
                isA5
                  ? "h-9 sm:h-15 md:h-24 print:h-[22mm]"
                  : "h-8 sm:h-12 md:h-19 print:h-[18mm]"
              }`}
            />
            <span className="italic font-normal tracking-tight">
              {partner2}
            </span>
          </h5>
          {formattedDate ? (
            <p
              className={`tracking-[0.25em] font-sans text-neutral-500 font-semibold uppercase mt-1 sm:mt-2 md:mt-2.5 ${
                isA5
                  ? "text-[8.5px] sm:text-xs md:text-sm print:text-[12px]"
                  : "text-[7.5px] sm:text-[10px] md:text-xs print:text-[10px]"
              }`}
            >
              {formattedDate}
            </p>
          ) : null}
        </div>
      </div>

      {/* 4. Bottom Footer: Pinned at bottom right */}
      <div
        className={`absolute z-10 select-none print-footer ${
          isA5
            ? "bottom-3 right-3 sm:bottom-4.5 sm:right-5 md:bottom-6 md:right-7"
            : "bottom-2.5 right-2.5 sm:bottom-3.5 sm:right-4 md:bottom-5 md:right-5"
        }`}
      >
        <div className="flex flex-col items-center gap-0.5 sm:gap-1 text-neutral-800 select-none">
          <img
            src={FOTOKITA_MINI_QR_URL}
            alt="fotokita.com QR"
            className={`object-contain rounded-xs shrink-0 ${
              isA5 ? "size-6 sm:size-8 md:size-10" : "size-5 sm:size-7 md:size-8.5"
            }`}
          />
          <div className="flex items-center gap-0.5 sm:gap-1 leading-none">
            <FotokitaLogo
              variant="mark"
              size="sm"
              className={`text-neutral-800 shrink-0 ${
                isA5 ? "size-2.5 sm:size-3.5 md:size-4" : "size-2 sm:size-3 md:size-3.5"
              }`}
            />
            <span
              className={`font-bold tracking-tight text-neutral-900 font-sans ${
                isA5
                  ? "text-[7.5px] sm:text-xs md:text-sm"
                  : "text-[7px] sm:text-[10px] md:text-[11px]"
              }`}
            >
              fotokita<span className="text-[#BD755A]">.com</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SubAdminTableQrModal: React.FC<SubAdminTableQrModalProps> = ({
  isOpen,
  onClose,
  guestPublicUrl,
  customization,
  weddingName,
  weddingDate,
  uploadedPhotos = [],
}) => {
  const [activeTab, setActiveTab] = useState<"standee" | "quick">("standee");
  const [cardSize, setCardSize] = useState<StandeeCardSize>("a6");
  const [cardTheme, setCardTheme] = useState<StandeeTheme>("classic-white");
  const [useUploadedPhotos, setUseUploadedPhotos] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  // Format couple names
  let partner1 = customization.partner1?.trim() || "";
  let partner2 = customization.partner2?.trim() || "";
  if ((!partner1 || !partner2) && weddingName) {
    if (weddingName.includes("&")) {
      const parts = weddingName.split("&").map((s) => s.trim());
      partner1 = partner1 || parts[0] || "";
      partner2 = partner2 || parts[1] || "";
    } else if (weddingName.includes("+")) {
      const parts = weddingName.split("+").map((s) => s.trim());
      partner1 = partner1 || parts[0] || "";
      partner2 = partner2 || parts[1] || "";
    } else if (weddingName.includes(" and ")) {
      const parts = weddingName.split(" and ").map((s) => s.trim());
      partner1 = partner1 || parts[0] || "";
      partner2 = partner2 || parts[1] || "";
    }
  }
  if (!partner1 && !partner2) {
    partner1 = "Groom";
    partner2 = "Bride";
  }

  // Format wedding date in dotted format: "DD . MM . YYYY"
  const formatCardDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const datePart = dateString.includes("T") ? dateString.split("T")[0] : dateString;
      if (datePart && datePart.includes("-")) {
        const parts = datePart.split("-").map(Number);
        if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
          const year = parts[0];
          const month = String(parts[1]).padStart(2, "0");
          const day = String(parts[2]).padStart(2, "0");
          return `${day} . ${month} . ${year}`;
        }
      }
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day} . ${month} . ${year}`;
    } catch {
      return dateString;
    }
  };

  // Prioritize real marriage date: ignore legacy hardcoded "2026-10-30" if other date sources exist
  const effectiveRawDate =
    (customization.weddingDate && customization.weddingDate !== "2026-10-30" ? customization.weddingDate : "") ||
    (weddingDate && weddingDate !== "2026-10-30" ? weddingDate : "") ||
    customization.weddingDate ||
    weddingDate ||
    "";

  const formattedDate = formatCardDate(effectiveRawDate);

  // High-res main QR URL (600x600 for sharp print rendering)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=8&data=${encodeURIComponent(
    guestPublicUrl
  )}`;

  // Example photos (use uploaded tenant photos if toggled and available, otherwise curated samples)
  const photoLeft =
    useUploadedPhotos && uploadedPhotos[0]?.url
      ? uploadedPhotos[0].url
      : DEFAULT_SAMPLE_PHOTOS.couple;

  const photoRight =
    useUploadedPhotos && uploadedPhotos[1]?.url
      ? uploadedPhotos[1].url
      : DEFAULT_SAMPLE_PHOTOS.celebration;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(guestPublicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Guest gallery link copied to clipboard!");
  };

  const handlePrint = () => {
    const sizeNote =
      cardSize === "a6"
        ? "A6 size (105 × 148 mm • Table Standee)"
        : "A5 size (148 × 210 mm • Large Display Sign)";
    toast.info("Opening print dialog...", {
      description: `Printing 1 card in ${sizeNote}. In print settings, select A4 portrait paper.`,
    });
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleDownloadQrOnly = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `fotokita-qr-${customization.slug || "wedding"}.png`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded!");
  };

  // Download Card as high-res PNG image via HTML5 Canvas (300 DPI)
  const handleDownloadCardPng = async () => {
    setIsDownloading(true);
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const canvas = document.createElement("canvas");
      // Standard ISO 216 at 300 DPI:
      // A6: 105 × 148 mm = 1240 × 1748 px
      // A5: 148 × 210 mm = 1748 × 2480 px
      const width = cardSize === "a5" ? 1748 : 1240;
      const height = cardSize === "a5" ? 2480 : 1748;
      const scale = width / 1240; // Scale multiplier for A5 vs A6

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D canvas context");

      // Background
      if (cardTheme === "warm-ivory") {
        ctx.fillStyle = "#FAF7F2";
      } else if (cardTheme === "soft-blush") {
        ctx.fillStyle = "#FAF4F2";
      } else {
        ctx.fillStyle = "#FFFFFF";
      }
      ctx.fillRect(0, 0, width, height);

      // Outer delicate double border
      ctx.strokeStyle = cardTheme === "warm-ivory" ? "#D9CEBE" : "#E5E0DB";
      ctx.lineWidth = 4 * scale;
      ctx.strokeRect(36 * scale, 36 * scale, width - 72 * scale, height - 72 * scale);
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeRect(48 * scale, 48 * scale, width - 96 * scale, height - 96 * scale);

      // Helper to load image
      const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      // 1. Header "S H A R E" - Vertically centered balance
      ctx.textAlign = "center";
      ctx.fillStyle = "#1F1D1B";
      ctx.font = `600 ${Math.round(40 * scale)}px 'Montserrat', sans-serif`;
      ctx.fillText("S H A R E", width / 2, 190 * scale);

      // Fine horizontal rule behind "the love"
      ctx.strokeStyle = "#C9C0B7";
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(140 * scale, 275 * scale);
      ctx.lineTo(width - 140 * scale, 275 * scale);
      ctx.stroke();

      // Mask background pill for "the love"
      ctx.fillStyle = cardTheme === "warm-ivory" ? "#FAF7F2" : cardTheme === "soft-blush" ? "#FAF4F2" : "#FFFFFF";
      ctx.fillRect(width / 2 - 200 * scale, 218 * scale, 400 * scale, 115 * scale);

      // Script Calligraphy "the love": Wedding style, prominent & larger
      ctx.fillStyle = "#1F1D1B";
      ctx.font = `italic 400 ${Math.round(135 * scale)}px 'Alex Brush', 'Great Vibes', cursive`;
      ctx.fillText("the love", width / 2, 310 * scale);

      // Subtitles directly below "the love"
      ctx.font = `700 ${Math.round(32 * scale)}px 'Montserrat', 'Inter', sans-serif`;
      ctx.fillStyle = "#2D2926";
      ctx.fillText("SHARE YOUR PHOTOS WITH US!", width / 2, 395 * scale);

      ctx.font = `500 ${Math.round(22 * scale)}px 'Inter', sans-serif`;
      ctx.fillStyle = "#6B635C";
      ctx.fillText("SIMPLY SCAN THE QR CODE AND UPLOAD", width / 2, 436 * scale);

      // 2. Centerpiece: Polaroids drawn BEHIND first, with gentle blur
      const qrImg = await loadImage(qrCodeUrl);
      const qrSize = Math.round(520 * scale);
      const qrX = width / 2 - qrSize / 2;
      const qrY = 530 * scale;

      const polW = Math.round(225 * scale);
      const polH = Math.round(285 * scale);
      const imgPadding = Math.round(11 * scale);
      const imgW = polW - imgPadding * 2;
      const imgH = polH - imgPadding * 2 - Math.round(30 * scale);
      const blurRadius = Math.round(5 * scale);
      const bleed = Math.round(6 * scale);

      // 2A. Left Flanking Photo Template (Snap photo) - Behind QR & blurred
      try {
        const leftImg = await loadImage(photoLeft);
        ctx.save();
        ctx.translate(qrX - 45 * scale, qrY + qrSize / 2);
        ctx.rotate((-8 * Math.PI) / 180);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // White polaroid frame
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-polW / 2, -polH / 2, polW, polH);
        ctx.strokeStyle = "#E6E0D8";
        ctx.lineWidth = 1.5 * scale;
        ctx.strokeRect(-polW / 2, -polH / 2, polW, polH);

        // Blurred photo clipped inside frame
        ctx.save();
        ctx.beginPath();
        ctx.rect(-polW / 2 + imgPadding, -polH / 2 + imgPadding, imgW, imgH);
        ctx.clip();
        try {
          ctx.filter = `blur(${blurRadius}px)`;
        } catch {
          // Fallback if ctx.filter is unavailable
        }
        ctx.drawImage(
          leftImg,
          -polW / 2 + imgPadding - bleed,
          -polH / 2 + imgPadding - bleed,
          imgW + bleed * 2,
          imgH + bleed * 2
        );
        ctx.restore();

        // Label
        ctx.font = `600 ${Math.round(12.5 * scale)}px 'Inter', sans-serif`;
        ctx.fillStyle = "#6B635C";
        ctx.textAlign = "center";
        ctx.fillText("📸 Snap photo", 0, polH / 2 - 13 * scale);
        ctx.restore();
      } catch (err) {
        console.warn("Could not draw left example photo onto canvas:", err);
      }

      // 2B. Right Flanking Photo Template (Share joy) - Behind QR & blurred
      try {
        const rightImg = await loadImage(photoRight);
        ctx.save();
        ctx.translate(qrX + qrSize + 45 * scale, qrY + qrSize / 2);
        ctx.rotate((8 * Math.PI) / 180);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // White polaroid frame
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-polW / 2, -polH / 2, polW, polH);
        ctx.strokeStyle = "#E6E0D8";
        ctx.lineWidth = 1.5 * scale;
        ctx.strokeRect(-polW / 2, -polH / 2, polW, polH);

        // Blurred photo clipped inside frame
        ctx.save();
        ctx.beginPath();
        ctx.rect(-polW / 2 + imgPadding, -polH / 2 + imgPadding, imgW, imgH);
        ctx.clip();
        try {
          ctx.filter = `blur(${blurRadius}px)`;
        } catch {
          // Fallback if ctx.filter is unavailable
        }
        ctx.drawImage(
          rightImg,
          -polW / 2 + imgPadding - bleed,
          -polH / 2 + imgPadding - bleed,
          imgW + bleed * 2,
          imgH + bleed * 2
        );
        ctx.restore();

        // Label
        ctx.font = `600 ${Math.round(12.5 * scale)}px 'Inter', sans-serif`;
        ctx.fillStyle = "#6B635C";
        ctx.textAlign = "center";
        ctx.fillText("❤️ Share joy", 0, polH / 2 - 13 * scale);
        ctx.restore();
      } catch (err) {
        console.warn("Could not draw right example photo onto canvas:", err);
      }

      // 2C. Center QR Code (In front of polaroids, pure white container with subtle shadow)
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
      ctx.shadowBlur = 20 * scale;
      ctx.shadowOffsetY = 6 * scale;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(qrX - 16 * scale, qrY - 16 * scale, qrSize + 32 * scale, qrSize + 32 * scale);
      ctx.restore();

      ctx.strokeStyle = "#EBE5DF";
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(qrX - 16 * scale, qrY - 16 * scale, qrSize + 32 * scale, qrSize + 32 * scale);

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 3. Center Couple Names & Date (Marriage names distinctly larger, optically centered)
      const p1 = partner1 || "Groom";
      const p2 = partner2 || "Bride";
      const coupleY = 1270 * scale;

      ctx.font = `italic 400 ${Math.round(108 * scale)}px 'Cormorant Garamond', Georgia, serif`;
      const p1W = ctx.measureText(p1).width;
      const p2W = ctx.measureText(p2).width;

      const heartH = Math.round(160 * scale);
      const heartW = Math.round(heartH * (612 / 408));
      const spacing = 28 * scale;
      const totalCoupleW = p1W + spacing + heartW + spacing + p2W;
      const startCoupleX = width / 2 - totalCoupleW / 2;

      // Draw partner1
      ctx.textAlign = "left";
      ctx.font = `italic 400 ${Math.round(108 * scale)}px 'Cormorant Garamond', Georgia, serif`;
      ctx.fillStyle = "#1F1D1B";
      ctx.fillText(p1, startCoupleX, coupleY);

      // Draw handwritten heart symbol image (larger than text, with optical center correction)
      try {
        const heartImg = await loadImage(loveHandwritingImg);
        const opticalShift = Math.round(heartW * 0.045);
        const heartX = startCoupleX + p1W + spacing - opticalShift;
        const heartY = coupleY - Math.round(heartH * 0.68);
        ctx.drawImage(heartImg, heartX, heartY, heartW, heartH);
      } catch {
        // Fallback handwritten bezier stroke
        ctx.save();
        ctx.strokeStyle = "#1F1D1B";
        ctx.lineWidth = 4.2 * scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        const heartX = startCoupleX + p1W + spacing;
        const heartY = coupleY - 60 * scale;
        const sx = (px: number) => heartX + (px / 24) * 60 * scale;
        const sy = (py: number) => heartY + (py / 24) * 60 * scale;
        ctx.moveTo(sx(12), sy(7.3));
        ctx.bezierCurveTo(sx(11), sy(4.1), sx(7.1), sy(3.0), sx(4.9), sy(5.9));
        ctx.bezierCurveTo(sx(2.5), sy(9.2), sx(3.5), sy(13.3), sx(6.8), sy(16.7));
        ctx.bezierCurveTo(sx(9.2), sy(19.2), sx(11.4), sy(21.0), sx(12), sy(21.5));
        ctx.bezierCurveTo(sx(12.6), sy(21.0), sx(14.8), sy(19.2), sx(17.2), sy(16.7));
        ctx.bezierCurveTo(sx(20.5), sy(13.3), sx(21.5), sy(9.2), sx(19.1), sy(5.9));
        ctx.bezierCurveTo(sx(16.9), sy(3.0), sx(13.0), sy(4.1), sx(12), sy(7.3));
        ctx.stroke();
        ctx.restore();
      }

      // Draw partner2
      ctx.textAlign = "left";
      ctx.font = `italic 400 ${Math.round(108 * scale)}px 'Cormorant Garamond', Georgia, serif`;
      ctx.fillStyle = "#1F1D1B";
      ctx.fillText(p2, startCoupleX + p1W + spacing + heartW + spacing, coupleY);

      // Date (only render if real date exists)
      if (formattedDate) {
        ctx.textAlign = "center";
        ctx.font = `600 ${Math.round(30 * scale)}px 'Montserrat', sans-serif`;
        ctx.fillStyle = "#6B635C";
        ctx.fillText(formattedDate, width / 2, coupleY + 88 * scale);
      }

      // 4. Bottom Right Ads: Mini QR above, Camera Icon & fotokita.com below that QR
      try {
        const miniQrImg = await loadImage(FOTOKITA_MINI_QR_URL);
        const qrSize = Math.round(92 * scale);
        const iconW = Math.round(22 * scale);
        const iconH = Math.round(iconW * 0.78);
        const iconGap = Math.round(7 * scale);

        ctx.font = `700 ${Math.round(20 * scale)}px 'Plus Jakarta Sans', sans-serif`;
        const fkPartW = ctx.measureText("fotokita").width;
        const comPartW = ctx.measureText(".com").width;
        const textTotalW = fkPartW + comPartW;
        const textRowW = iconW + iconGap + textTotalW;

        const adBlockW = Math.max(qrSize, textRowW);
        const adBlockX = width - adBlockW - 54 * scale;
        const qrX = adBlockX + (adBlockW - qrSize) / 2;
        const qrY = height - 175 * scale;

        // Draw Mini QR above
        ctx.drawImage(miniQrImg, qrX, qrY, qrSize, qrSize);

        // Draw Camera Icon & fotokita.com below the QR
        const textRowX = adBlockX + (adBlockW - textRowW) / 2;
        const textRowY = qrY + qrSize + Math.round(18 * scale);
        const camX = textRowX;
        const camY = textRowY - Math.round(iconH * 0.75);

        ctx.save();
        ctx.fillStyle = "#1F1D1B";
        const cr = Math.round(3 * scale);
        ctx.beginPath();
        ctx.roundRect(camX, camY, iconW, iconH, cr);
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(
          camX + Math.round(iconW * 0.28),
          camY - Math.round(3 * scale),
          Math.round(iconW * 0.44),
          Math.round(4 * scale),
          1.5 * scale
        );
        ctx.fill();

        ctx.fillStyle = cardTheme === "warm-ivory" ? "#FAF7F2" : cardTheme === "soft-blush" ? "#FAF4F2" : "#FFFFFF";
        ctx.beginPath();
        ctx.arc(camX + iconW / 2, camY + iconH / 2, Math.round(iconH * 0.32), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1F1D1B";
        ctx.beginPath();
        ctx.arc(camX + iconW / 2, camY + iconH / 2, Math.round(iconH * 0.18), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw fotokita.com text
        const textX = camX + iconW + iconGap;
        ctx.textAlign = "left";
        ctx.font = `700 ${Math.round(18 * scale)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = "#1F1D1B";
        ctx.fillText("fotokita", textX, textRowY);

        ctx.fillStyle = "#BD755A";
        ctx.fillText(".com", textX + fkPartW, textRowY);
      } catch (err) {
        console.warn("Could not draw mini fotokita QR onto canvas:", err);
      }

      // Export canvas
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to generate standee image");
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `table-standee-${cardSize}-${customization.slug || "wedding"}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`High-resolution ${cardSize.toUpperCase()} standee downloaded!`);
      }, "image/png");
    } catch (err) {
      console.error("Canvas export failed:", err);
      toast.error("Export failed. You can use 'Print Hardcopy' directly!");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* SCOPED PRINT STYLES */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide entire website UI when printing */
          body > * {
            visibility: hidden !important;
          }
          /* Show only the designated printable root */
          #fotokita-printable-root,
          #fotokita-printable-root * {
            visibility: visible !important;
          }
          #fotokita-printable-root {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            z-index: 999999 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }

          /* A6 STAND DISPLAY: 105mm x 148mm (1 pc centered on A4 with cut line) */
          .print-card-a6 {
            width: 105mm !important;
            max-width: 105mm !important;
            height: 148mm !important;
            max-height: 148mm !important;
            padding: 7mm 6mm !important;
            box-sizing: border-box !important;
            border: 1px dashed #b0b0b0 !important;
            border-radius: 6px !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            align-items: center !important;
            page-break-inside: avoid !important;
            position: relative !important;
          }
          .print-card-a6 .main-qr-img {
            width: 52mm !important;
            height: 52mm !important;
          }
          .print-card-a6 .photo-left-polaroid,
          .print-card-a6 .photo-right-polaroid {
            width: 26mm !important;
          }
          .print-card-a6 .print-footer {
            position: absolute !important;
            bottom: 5mm !important;
            right: 5mm !important;
          }

          /* A5 STAND DISPLAY: 148mm x 210mm (1 pc centered on A4 with cut line) */
          .print-card-a5 {
            width: 148mm !important;
            max-width: 148mm !important;
            height: 210mm !important;
            max-height: 210mm !important;
            padding: 10mm 9mm !important;
            box-sizing: border-box !important;
            border: 1px dashed #b0b0b0 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            align-items: center !important;
            page-break-inside: avoid !important;
            position: relative !important;
          }
          .print-card-a5 .main-qr-img {
            width: 72mm !important;
            height: 72mm !important;
          }
          .print-card-a5 .photo-left-polaroid,
          .print-card-a5 .photo-right-polaroid {
            width: 34mm !important;
          }
          .print-card-a5 .print-footer {
            position: absolute !important;
            bottom: 8mm !important;
            right: 8mm !important;
          }
        }
      `}</style>

      {/* MODAL OVERLAY */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in-50 overflow-y-auto">
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden relative">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <QrCode className="size-4.5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-foreground leading-tight">
                  Wedding Table QR Standee
                </h3>
                <p className="text-xs text-muted-foreground">
                  Print-ready table cards for guest photo uploads
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Sub-Header Tabs & Quick Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 sm:px-5 py-2 sm:py-2.5 border-b border-border bg-card text-xs">
            {/* View Switcher: Table Standee vs Quick Phone Test */}
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("standee")}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md font-medium transition-colors cursor-pointer text-xs ${
                  activeTab === "standee"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Printer className="size-3.5" />
                <span>Table Standee Card</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("quick")}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md font-medium transition-colors cursor-pointer text-xs ${
                  activeTab === "quick"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone className="size-3.5" />
                <span>Quick Phone Test</span>
              </button>
            </div>

            {/* Quick URL & Copy Button */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto sm:max-w-xs">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/50 border border-border text-[11px] font-mono text-muted-foreground truncate flex-1">
                <span className="truncate">{guestPublicUrl}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-7 text-xs gap-1 cursor-pointer shrink-0 px-2.5"
              >
                {copiedLink ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
                <span>{copiedLink ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          </div>

          {/* Main Content Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 bg-[#F5F2EC] dark:bg-[#121110]">
            {activeTab === "standee" ? (
              <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-6 items-center lg:items-start max-w-5xl mx-auto">
                {/* 1. Standee Card Preview: Shown first on mobile (order-1 lg:order-2) for instant visual feedback */}
                <div className="w-full lg:col-span-7 order-1 lg:order-2 flex flex-col items-center justify-center">
                  <div className="text-center mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Preview • {cardSize.toUpperCase()} ({cardSize === "a6" ? "105 × 148 mm" : "148 × 210 mm"})
                    </span>
                  </div>

                  {/* PRINTABLE ROOT CONTAINER: Exactly 1 card centered */}
                  <div id="fotokita-printable-root" className="w-full flex items-center justify-center p-1 sm:p-2">
                    <StandeeCardInner
                      cardSize={cardSize}
                      cardTheme={cardTheme}
                      partner1={partner1}
                      partner2={partner2}
                      formattedDate={formattedDate}
                      qrCodeUrl={qrCodeUrl}
                      photoLeft={photoLeft}
                      photoRight={photoRight}
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground text-center mt-2.5">
                    Prints centered on A4 paper with light cut guidelines.
                  </p>
                </div>

                {/* 2. Controls & Customizer Settings (order-2 lg:order-1) */}
                <div className="w-full lg:col-span-5 order-2 lg:order-1 space-y-4">
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3.5 sm:space-y-4">
                    {/* Standee Size Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Size
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "a6", label: "A6 Standee", sub: "105 × 148 mm" },
                          { id: "a5", label: "A5 Display", sub: "148 × 210 mm" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setCardSize(opt.id as StandeeCardSize)}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              cardSize === opt.id
                                ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/20 shadow-2xs"
                                : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span className="text-xs font-semibold block text-foreground">
                              {opt.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              {opt.sub}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Theme Palette */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Paper Tone
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "classic-white", name: "White", color: "#FFFFFF" },
                          { id: "warm-ivory", name: "Ivory", color: "#FAF7F2" },
                          { id: "soft-blush", name: "Blush", color: "#FAF4F2" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setCardTheme(t.id as StandeeTheme)}
                            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                              cardTheme === t.id
                                ? "border-primary bg-primary/10 shadow-2xs ring-1 ring-primary/20 font-medium"
                                : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span
                              className="size-3 rounded-full border border-black/15 shrink-0"
                              style={{ backgroundColor: t.color }}
                            />
                            <span className="text-xs font-medium text-foreground">{t.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Example Photos Source */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Photos
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setUseUploadedPhotos(false)}
                          className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                            !useUploadedPhotos
                              ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20 shadow-2xs"
                              : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Sample
                        </button>
                        <button
                          type="button"
                          disabled={uploadedPhotos.length < 2}
                          onClick={() => setUseUploadedPhotos(true)}
                          className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                            useUploadedPhotos
                              ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20 shadow-2xs"
                              : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                          }`}
                        >
                          Our Gallery {uploadedPhotos.length >= 2 ? `(${uploadedPhotos.length})` : ""}
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1 border-t border-border/60">
                      {/* Priority Main Action: Black Primary Button */}
                      <Button
                        type="button"
                        onClick={handleDownloadCardPng}
                        disabled={isDownloading}
                        className="w-full text-xs font-semibold h-10 cursor-pointer shadow-sm bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 rounded-xl"
                      >
                        <Download className="size-3.5 mr-1.5" />
                        {isDownloading ? "Generating Standee..." : `Download ${cardSize.toUpperCase()} Standee`}
                      </Button>

                      {/* Alternative Choices: Print A4 & QR Code Only */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrint}
                          className="text-xs h-8.5 cursor-pointer rounded-xl text-muted-foreground hover:text-foreground"
                        >
                          <Printer className="size-3 mr-1" />
                          Print (A4 Ready)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleDownloadQrOnly}
                          className="text-xs h-8.5 cursor-pointer rounded-xl text-muted-foreground hover:text-foreground"
                        >
                          <QrCode className="size-3 mr-1" />
                          QR Code Only
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* QUICK PHONE TEST TAB */
              <div className="max-w-md mx-auto py-6 space-y-5 text-center">
                <div className="space-y-1">
                  <h4 className="font-serif text-xl font-medium text-foreground">
                    Scan with Your Smartphone
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Open your iPhone or Android camera to preview exactly what wedding guests will see.
                  </p>
                </div>

                <div className="flex justify-center p-4 bg-white rounded-2xl border border-border shadow-inner max-w-xs mx-auto">
                  <img
                    src={qrCodeUrl}
                    alt="Guest Gallery QR Code"
                    className="size-56 object-contain"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/60 border border-border text-xs max-w-xs mx-auto">
                    <span className="truncate flex-1 font-mono text-[11px] text-muted-foreground text-left">
                      {guestPublicUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="shrink-0 p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {copiedLink ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(guestPublicUrl, "_blank", "noopener,noreferrer")}
                      className="text-xs cursor-pointer"
                    >
                      <Eye className="size-3.5 mr-1.5" />
                      Open Guest View in New Tab
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => setActiveTab("standee")}
                      className="text-xs cursor-pointer"
                    >
                      <Printer className="size-3.5 mr-1.5" />
                      View Table Standee Card
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SubAdminTableQrModal;
