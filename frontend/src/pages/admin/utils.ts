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

export const getWhatsAppMessageText = (invite: AdminInvite): string => {
  const url = `${window.location.origin}/register?token=${encodeURIComponent(invite.token)}`;
  const clientGreeting = invite.clientName ? `Hi ${invite.clientName}` : "Hi";
  const tierName = formatTierLabel(invite.tier);
  let dateDetails = "";
  if (invite.weddingDate) {
    dateDetails += `\n📅 Tarikh Majlis: ${invite.weddingDate}`;
  }
  if (invite.planStartDate) {
    dateDetails += `\n⏱️ Mula Guna: ${invite.planStartDate.replace("T", " ")}`;
  }
  return `${clientGreeting}! Terima kasih atas langganan pakej Fotokita ${tierName}.${dateDetails}\n\nSila gunakan pautan rasmi ini untuk melengkapkan akaun Sub-Admin majlis anda:\n${url}\n\n⚠️ Peringatan: Pautan ini sah selama 24 jam sahaja (Single-Use). Sila lengkapkan pendaftaran anda sebelum tamat tempoh.`;
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
