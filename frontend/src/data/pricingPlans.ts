export interface PricingPlanItem {
  id: string;
  name: string;
  badge: string;
  price: string;
  duration: string;
  description: string;
  features: { text: string; highlight?: boolean }[];
  isPopular?: boolean;
  isSpecialPartner?: boolean;
  code: string;
}

export const PRICING_PLANS: PricingPlanItem[] = [
  {
    id: "12h",
    name: "12 Hours Pass",
    badge: "12 Hours • Short Session",
    price: "RM 6",
    duration: "/ 12 hours",
    description: "Ideal for solemnization (nikah), engagement ceremonies, or brief receptions.",
    code: "12 Hours (RM6)",
    features: [
      { text: "1 GB Cloud Storage (~300 photos)" },
      { text: "Live Table QR code guest standees" },
      { text: "Instant upload with zero app downloads" },
      { text: "12 hours active live gallery access" },
    ],
  },
  {
    id: "1day",
    name: "Whole Day Pass",
    badge: "Whole Day • 24 Hours",
    isPopular: true,
    price: "RM 10",
    duration: "/ 24 hours",
    description: "Most popular choice for full-day wedding celebrations (day & evening).",
    code: "Whole Day (RM10)",
    features: [
      { text: "5 GB Cloud Storage (~1,500 HD photos)", highlight: true },
      { text: "Custom URL (fotokita.com/your-name)" },
      { text: "Live Ballroom Screen & Projector Slideshow", highlight: true },
      { text: "Digital Photobooth & Signature Polaroid" },
      { text: "Print-ready table QR card templates" },
      { text: "1-Click Bulk High-Res ZIP Download" },
      { text: "24 hours full gallery access" },
    ],
  },
  {
    id: "3days",
    name: "3 Days Pass",
    badge: "3 Days • Weekend Pass",
    price: "RM 17",
    duration: "/ 3 days",
    description: "Perfect for multi-day events: henna night, Friday solemnization & Sunday banquet.",
    code: "3 Days (RM17)",
    features: [
      { text: "10 GB Cloud Storage (~3,000 HD photos)", highlight: true },
      { text: "Everything in Whole Day Pass included" },
      { text: "Live Projector & TV Ballroom Slideshow" },
      { text: "Digital Photobooth & Polaroid Frames" },
      { text: "3 days active upload & viewing access" },
    ],
  },
  {
    id: "1week",
    name: "1 Week Pass",
    badge: "1 Week • Best Value",
    price: "RM 23",
    duration: "/ 7 days",
    description: "A full week of leisurely celebration with extended family across both venues.",
    code: "1 Week (RM23)",
    features: [
      { text: "15 GB Large Storage (~5,000 photos & clips)", highlight: true },
      { text: "Everything in 3 Days Pass included" },
      { text: "Short guest video clip uploads" },
      { text: "7 days active upload & download access" },
      { text: "Print-ready A6 PDF table card templates" },
    ],
  },
  {
    id: "1month",
    name: "1 Month Pass",
    badge: "1 Month • Extended Archive",
    price: "RM 46",
    duration: "/ month",
    description: "Relive and gather every guest memory with zero rush throughout the month.",
    code: "1 Month (RM46)",
    features: [
      { text: "30 GB Large Storage (~10,000 photos & videos)", highlight: true },
      { text: "Everything in 1 Week Pass included" },
      { text: "30 days complete upload & viewing access" },
      { text: "Uncompressed full HD photo quality" },
      { text: "Priority technical assistance & support" },
    ],
  },
  {
    id: "1year",
    name: "1 Year Special",
    badge: "Photographers & Hall Partners",
    isSpecialPartner: true,
    price: "RM 189",
    duration: "/ year",
    description: "Tailored for Photographers, Event Organizers, Wedding Planners & Banquet Hall Owners.",
    code: "1 Year Special (RM189)",
    features: [
      { text: "100 GB Massive Cloud Storage", highlight: true },
      { text: "Multi-event coverage throughout 1 full year" },
      { text: "Custom Branding (Your studio / hall name)" },
      { text: "4K video support & high-speed downloads" },
      { text: "VIP Priority WhatsApp Concierge Support" },
    ],
  },
];
