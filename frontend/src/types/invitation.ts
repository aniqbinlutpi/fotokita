export type CardStyle = "classic" | "floral" | "minimal";

export interface InvitationScheduleItem {
  time: string;
  title: string;
}

export interface InvitationContact {
  name: string;
  role: string;
  phone: string;
}

export interface Invitation {
  weddingId: string;
  enabled: boolean;
  openingGreeting: string;
  hostNames: string;
  inviteMessage: string;
  eventStart: string | null;
  eventEnd: string | null;
  venueName: string;
  venueAddress: string;
  latitude: string | null;
  longitude: string | null;
  schedule: InvitationScheduleItem[];
  contacts: InvitationContact[];
  musicUrl: string | null;
  cardStyle: CardStyle;
}

export type InvitationInput = Omit<Invitation, "weddingId">;

export const DEFAULT_INVITATION: InvitationInput = {
  enabled: false,
  openingGreeting: "Walimatulurus",
  hostNames: "",
  inviteMessage: "Dengan penuh kesyukuran, kami menjemput Dato'/Datin/Tuan/Puan/Encik/Cik hadir ke majlis perkahwinan kami.",
  eventStart: null,
  eventEnd: null,
  venueName: "",
  venueAddress: "",
  latitude: null,
  longitude: null,
  schedule: [],
  contacts: [],
  musicUrl: null,
  cardStyle: "classic",
};

export const MUSIC_PRESETS: { label: string; url: string }[] = [
  { label: "Tiada muzik", url: "" },
  { label: "Lembut (piano)", url: "/music/soft-piano.mp3" },
  { label: "Romantik (gitar)", url: "/music/romantic-guitar.mp3" },
  { label: "Tradisional", url: "/music/traditional.mp3" },
];
