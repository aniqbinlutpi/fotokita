import React, { useEffect, useState } from "react";
import { CalendarPlus, MapPin, Navigation, Phone, MessageCircle } from "lucide-react";
import type { Invitation } from "@/types/invitation";
import type { CardPalette } from "@/lib/themes";
import {
  downloadIcs,
  googleCalendarUrl,
  googleMapsEmbedUrl,
  googleMapsUrl,
  mapsQuery,
  telUrl,
  timeLeft,
  wazeUrl,
  whatsappUrl,
} from "@/lib/invitation";

interface SectionProps {
  inv: Invitation;
  palette: CardPalette;
  titleFont: string;
}

const dateFmt = new Intl.DateTimeFormat("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("ms-MY", { hour: "numeric", minute: "2-digit", hour12: true });

const btn =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition active:scale-95";

export const InvitationHeader: React.FC<SectionProps & { partner1: string; partner2: string }> = ({
  inv,
  palette,
  titleFont,
  partner1,
  partner2,
}) => (
  <section className="space-y-4 text-center">
    {inv.openingGreeting && (
      <p className="text-xs uppercase tracking-[0.35em]" style={{ color: palette.accent }}>
        {inv.openingGreeting}
      </p>
    )}
    {inv.hostNames && (
      <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: palette.ink }}>
        {inv.hostNames}
      </p>
    )}
    {inv.inviteMessage && (
      <p className="whitespace-pre-line text-sm leading-relaxed opacity-80" style={{ color: palette.ink }}>
        {inv.inviteMessage}
      </p>
    )}
    <h2 className="text-5xl leading-tight" style={{ fontFamily: titleFont, color: palette.deep }}>
      {partner1}
      {partner2 && (
        <>
          <span className="block text-3xl" style={{ color: palette.accent }}>
            &amp;
          </span>
          {partner2}
        </>
      )}
    </h2>
  </section>
);

export const InvitationDateTime: React.FC<SectionProps> = ({ inv, palette, titleFont }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!inv.eventStart) return null;
  const start = new Date(inv.eventStart);
  const end = inv.eventEnd ? new Date(inv.eventEnd) : null;
  const left = timeLeft(start, now);
  const units: [string, number][] = [
    ["Hari", left.days],
    ["Jam", left.hours],
    ["Minit", left.minutes],
    ["Saat", left.seconds],
  ];

  return (
    <section className="space-y-5 text-center">
      <h3 className="text-2xl" style={{ fontFamily: titleFont, color: palette.deep }}>
        {dateFmt.format(start)}
      </h3>
      <p className="text-sm" style={{ color: palette.ink }}>
        {timeFmt.format(start)}
        {end ? ` – ${timeFmt.format(end)}` : ""}
      </p>
      {!left.done && (
        <div className="grid grid-cols-4 gap-2">
          {units.map(([label, value]) => (
            <div key={label} className="rounded-xl py-3" style={{ background: palette.soft + "55", color: palette.deep }}>
              <div className="text-2xl font-semibold tabular-nums">{String(value).padStart(2, "0")}</div>
              <div className="text-[10px] uppercase tracking-widest opacity-70">{label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export const InvitationVenue: React.FC<SectionProps> = ({ inv, palette, titleFont }) => {
  if (!mapsQuery(inv)) return null;
  return (
    <section className="space-y-4 text-center">
      <h3 className="text-2xl" style={{ fontFamily: titleFont, color: palette.deep }}>
        Lokasi
      </h3>
      {inv.venueName && (
        <p className="font-medium" style={{ color: palette.deep }}>
          {inv.venueName}
        </p>
      )}
      {inv.venueAddress && (
        <p className="whitespace-pre-line text-sm" style={{ color: palette.ink }}>
          {inv.venueAddress}
        </p>
      )}
      <iframe
        title="Peta lokasi"
        src={googleMapsEmbedUrl(inv)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-60 w-full rounded-2xl border-0"
      />
      <div className="flex flex-wrap justify-center gap-3">
        <a className={btn} style={{ background: palette.deep, color: palette.paper }} href={googleMapsUrl(inv)} target="_blank" rel="noreferrer">
          <MapPin size={16} /> Google Maps
        </a>
        <a className={btn} style={{ background: palette.accent, color: palette.paper }} href={wazeUrl(inv)} target="_blank" rel="noreferrer">
          <Navigation size={16} /> Waze
        </a>
      </div>
    </section>
  );
};

export const InvitationSchedule: React.FC<SectionProps> = ({ inv, palette, titleFont }) => {
  if (inv.schedule.length === 0) return null;
  return (
    <section className="space-y-4">
      <h3 className="text-center text-2xl" style={{ fontFamily: titleFont, color: palette.deep }}>
        Atur Cara
      </h3>
      <ul className="space-y-3 border-l-2 pl-5" style={{ borderColor: palette.soft }}>
        {inv.schedule.map((item, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: palette.accent }} />
            <p className="text-xs font-semibold tracking-wider" style={{ color: palette.accent }}>
              {item.time}
            </p>
            <p className="text-sm" style={{ color: palette.ink }}>
              {item.title}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export const InvitationContacts: React.FC<SectionProps> = ({ inv, palette, titleFont }) => {
  if (inv.contacts.length === 0) return null;
  return (
    <section className="space-y-4">
      <h3 className="text-center text-2xl" style={{ fontFamily: titleFont, color: palette.deep }}>
        Hubungi Kami
      </h3>
      <ul className="space-y-3">
        {inv.contacts.map((c, i) => (
          <li key={i} className="flex items-center justify-between gap-3 rounded-2xl p-4" style={{ background: palette.soft + "40" }}>
            <div className="min-w-0">
              <p className="truncate font-medium" style={{ color: palette.deep }}>
                {c.name}
              </p>
              {c.role && (
                <p className="truncate text-xs opacity-70" style={{ color: palette.ink }}>
                  {c.role}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <a aria-label={`Call ${c.name}`} href={telUrl(c.phone)} className="rounded-full p-2.5" style={{ background: palette.deep, color: palette.paper }}>
                <Phone size={16} />
              </a>
              <a aria-label={`WhatsApp ${c.name}`} href={whatsappUrl(c.phone)} target="_blank" rel="noreferrer" className="rounded-full p-2.5" style={{ background: "#25D366", color: "#fff" }}>
                <MessageCircle size={16} />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export const AddToCalendar: React.FC<SectionProps & { title: string }> = ({ inv, palette, title }) => {
  const gcal = googleCalendarUrl(inv, title);
  if (!gcal) return null;
  return (
    <section className="flex flex-wrap justify-center gap-3">
      <a className={btn} style={{ background: palette.deep, color: palette.paper }} href={gcal} target="_blank" rel="noreferrer">
        <CalendarPlus size={16} /> Google Calendar
      </a>
      <button type="button" className={btn} style={{ background: palette.accent, color: palette.paper }} onClick={() => downloadIcs(inv, title)}>
        <CalendarPlus size={16} /> Apple / Outlook
      </button>
    </section>
  );
};
