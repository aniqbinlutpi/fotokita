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

export const getWhatsAppShareUrl = (invite: AdminInvite): string => {
  const url = `${window.location.origin}/register?token=${encodeURIComponent(invite.token)}`;
  const clientGreeting = invite.clientName ? `Hi ${invite.clientName}` : "Hi";
  const tierName = formatTierLabel(invite.tier);
  const message = `${clientGreeting}! Thank you for your payment for the Fotokita ${tierName} package.\n\nPlease use this official link to register your Sub-Admin account and launch your wedding gallery:\n${url}\n\n⚠️ Notice: This link is valid for 24 hours only and is single-use. Please complete your registration before expiry.`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

export const getCustomerWhatsAppDirectUrl = (
  phone: string,
  username: string,
  planName: string
): string => {
  const digits = phone.replace(/\D/g, "");
  const formatted = digits.startsWith("60")
    ? digits
    : digits.startsWith("0")
    ? `60${digits.slice(1)}`
    : digits;
  const msg = `Hi ${username}! Thank you for your inquiry about Fotokita's ${planName} package. How can we assist you today?`;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`;
};
