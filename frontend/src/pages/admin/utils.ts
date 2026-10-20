import type { AdminInvite } from "@/api/admin";

export const formatTierLabel = (tier: string): string => {
  switch (tier) {
    case "12h":
      return "12 Hours (RM6)";
    case "1day":
      return "Whole Day (RM10)";
    case "3days":
      return "3 Days (RM17)";
    case "1week":
      return "1 Week (RM23)";
    case "1month":
      return "1 Month (RM46)";
    case "1year":
      return "1 Year Special (RM189)";
    case "vip":
      return "VIP (100GB)";
    case "premium":
      return "Pro Studio (30GB)";
    case "standard":
      return "Standard (10GB)";
    default:
      return tier;
  }
};

export const extractPhoneFromText = (text?: string): string => {
  if (!text) return "";
  const match = text.match(/(?:\+?60|0)1[0-9]{1}[- ]?[0-9]{7,8}/);
  return match ? match[0] : "";
};

export const formatWhatsAppPhone = (phone?: string): string => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("60")) return digits;
  if (digits.startsWith("0")) return `60${digits.slice(1)}`;
  return digits;
};

export const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  const [year, month, day] = parts;
  if (year !== undefined && month !== undefined && day !== undefined && !isNaN(year) && !isNaN(month) && !isNaN(day)) {
    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
  }
  return dateStr;
};

export const formatDisplayDateTime = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      return `${day}/${month}/${year}, ${timeStr}`;
    }
  } catch {}
  return dateStr.replace("T", " ");
};

export const getWhatsAppMessageText = (invite: AdminInvite): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://fotokita.com";
  const url = `${origin}/register?token=${encodeURIComponent(invite.token)}`;
  const clientGreeting = invite.clientName ? `Hi ${invite.clientName}` : "Hi";
  const tierName = formatTierLabel(invite.tier);

  const weddingFormatted = invite.weddingDate ? formatDisplayDate(invite.weddingDate) : "";
  const startFormatted = invite.planStartDate ? formatDisplayDateTime(invite.planStartDate) : "";

  let dateDetails = "";
  if (weddingFormatted) {
    dateDetails += `\n• *Wedding Date:* ${weddingFormatted}`;
  }
  if (startFormatted) {
    dateDetails += `\n• *System Access & Activation:* ${startFormatted}`;
  }

  const startNotice = startFormatted
    ? `Your gallery system will be fully active and accessible starting from *${startFormatted}*.`
    : "Your gallery system will become active according to your scheduled start time.";

  return `${clientGreeting}! Thank you for subscribing to the Fotokita *${tierName}* package.${dateDetails}

*Next Important Steps:*
1. Please click this official link to complete your wedding Sub-Admin portal registration now:
${url}

2. IMPORTANT: Please make sure to *remember the Username and Password* you create during registration to log into your portal later.

3. ${startNotice}

(Notice: This registration link is valid for 24 hours only. Please complete your registration promptly).`;
};

export const getWhatsAppShareUrl = (
  invite: AdminInvite,
  customPhone?: string
): string => {
  const message = getWhatsAppMessageText(invite);
  const phone =
    customPhone ||
    invite.clientPhone ||
    extractPhoneFromText(invite.notes);
  const formattedPhone = formatWhatsAppPhone(phone);

  if (formattedPhone) {
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

export const getCustomerWhatsAppDirectUrl = (
  phone: string,
  username: string,
  planName: string
): string => {
  const formatted = formatWhatsAppPhone(phone);
  const msg = `Hi ${username}! Thank you for your inquiry about Fotokita's ${planName} package. How can we assist you today?`;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`;
};
