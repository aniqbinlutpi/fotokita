import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { getTenantCustomization } from "@/api/tenant";
import { useInvitation } from "@/hooks/queries/useInvitation";
import { getCardPalette } from "@/lib/themes";
import { getFontFamilyCss } from "@/lib/typography";
import { InvitationCover } from "@/components/invitation/InvitationCover";
import { InvitationFrame } from "@/components/invitation/InvitationFrame";
import { MusicToggle } from "@/components/invitation/MusicToggle";
import {
  AddToCalendar,
  InvitationContacts,
  InvitationDateTime,
  InvitationHeader,
  InvitationSchedule,
  InvitationVenue,
} from "@/components/invitation/InvitationSections";

interface Props {
  slug: string;
}

const coverDateFmt = new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "long", year: "numeric" });

export const InvitationPage: React.FC<Props> = ({ slug }) => {
  const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("preview");
  const { data: inv, isLoading, isError } = useInvitation(slug);
  const { data: custom } = useQuery({
    queryKey: ["customization", slug],
    queryFn: () => getTenantCustomization(slug),
  });
  const [opened, setOpened] = useState(isPreview);

  const palette = useMemo(() => getCardPalette(custom?.themePalette), [custom?.themePalette]);
  const titleFont = getFontFamilyCss(custom?.partnerFont);
  const partner1 = custom?.partner1 || "";
  const partner2 = custom?.partner2 || "";

  useEffect(() => {
    document.title = [partner1, partner2].filter(Boolean).join(" & ") || "Jemputan Perkahwinan";
  }, [partner1, partner2]);

  useEffect(() => {
    if (inv && !opened) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [inv, opened]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm opacity-60">Memuatkan jemputan…</div>;
  }

  if (isError || !inv) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-medium">Jemputan tidak ditemui</p>
        <a className="text-sm underline" href={`/${slug}`}>
          Lihat galeri majlis
        </a>
      </div>
    );
  }

  const coupleTitle = [partner1, partner2].filter(Boolean).join(" & ") || "Majlis Perkahwinan";
  const shared = { inv, palette, titleFont };

  return (
    <div className="min-h-screen sm:py-8" style={{ background: palette.soft + "66" }}>
      <AnimatePresence>
        {!opened && (
          <InvitationCover
            key="cover"
            partner1={partner1}
            partner2={partner2}
            dateText={inv.eventStart ? coverDateFmt.format(new Date(inv.eventStart)) : ""}
            palette={palette}
            titleFont={titleFont}
            onOpen={() => setOpened(true)}
          />
        )}
      </AnimatePresence>

      <InvitationFrame style={inv.cardStyle} palette={palette}>
        <InvitationHeader {...shared} partner1={partner1} partner2={partner2} />
        <InvitationDateTime {...shared} />
        <AddToCalendar {...shared} title={`Majlis Perkahwinan ${coupleTitle}`} />
        <InvitationVenue {...shared} />
        <InvitationSchedule {...shared} />
        <InvitationContacts {...shared} />
        <section className="text-center">
          <a
            href={`/${slug}`}
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition active:scale-95"
            style={{ borderColor: palette.accent, color: palette.deep }}
          >
            <Camera size={16} /> Kongsi gambar majlis
          </a>
        </section>
      </InvitationFrame>

      {inv.musicUrl && <MusicToggle src={inv.musicUrl} start={opened} palette={palette} />}
    </div>
  );
};
