import type { Invitation } from "@/types/invitation";

/** Invitations are for Malaysian weddings: times are always entered and shown in Malaysia time (GMT+8, no DST). */
export const MY_TIME_ZONE = "Asia/Kuala_Lumpur";
const MY_OFFSET_MS = 8 * 3600_000;

/** ISO instant -> value for <input type="datetime-local"> in Malaysia time */
export function toMyInput(iso: string | null): string {
  return iso ? new Date(new Date(iso).getTime() + MY_OFFSET_MS).toISOString().slice(0, 16) : "";
}

/** <input type="datetime-local"> value (Malaysia time) -> ISO instant */
export function fromMyInput(value: string): string | null {
  return value ? new Date(`${value}:00+08:00`).toISOString() : null;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function mapsQuery(inv: Pick<Invitation, "latitude" | "longitude" | "venueName" | "venueAddress">): string {
  if (inv.latitude && inv.longitude) return `${inv.latitude},${inv.longitude}`;
  return [inv.venueName, inv.venueAddress].filter(Boolean).join(", ");
}

export function googleMapsEmbedUrl(inv: Invitation): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery(inv))}&output=embed`;
}

export function googleMapsUrl(inv: Invitation): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(inv))}`;
}

export function wazeUrl(inv: Invitation): string {
  if (inv.latitude && inv.longitude) {
    return `https://waze.com/ul?ll=${inv.latitude},${inv.longitude}&navigate=yes`;
  }
  return `https://waze.com/ul?q=${encodeURIComponent(mapsQuery(inv))}&navigate=yes`;
}

/** Digits only, Malaysian local numbers (01x) become 601x */
export function whatsappUrl(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `6${digits}`;
  return `https://wa.me/${digits}`;
}

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

const toUtcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

function eventRange(inv: Invitation): { start: Date; end: Date } | null {
  if (!inv.eventStart) return null;
  const start = new Date(inv.eventStart);
  const end = inv.eventEnd ? new Date(inv.eventEnd) : new Date(start.getTime() + 3 * 3600_000);
  return { start, end };
}

export function googleCalendarUrl(inv: Invitation, title: string): string | null {
  const range = eventRange(inv);
  if (!range) return null;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toUtcStamp(range.start)}/${toUtcStamp(range.end)}`,
    location: [inv.venueName, inv.venueAddress].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const icsEscape = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");

export function downloadIcs(inv: Invitation, title: string): void {
  const range = eventRange(inv);
  if (!range) return;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fotokita//Invitation//MS",
    "BEGIN:VEVENT",
    `UID:${inv.weddingId}@fotokita.com`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(range.start)}`,
    `DTEND:${toUtcStamp(range.end)}`,
    `SUMMARY:${icsEscape(title)}`,
    `LOCATION:${icsEscape([inv.venueName, inv.venueAddress].filter(Boolean).join(", "))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "majlis-perkahwinan.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export function timeLeft(target: Date, now = Date.now()) {
  const diff = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    done: diff === 0,
  };
}
