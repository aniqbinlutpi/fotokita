import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useInvitation, useUpdateInvitation } from "@/hooks/queries/useInvitation";
import { DEFAULT_INVITATION, MUSIC_PRESETS, type CardStyle, type InvitationInput } from "@/types/invitation";

interface Props {
  weddingId: string;
  slug: string;
}

const CARD_STYLES: { id: CardStyle; label: string }[] = [
  { id: "classic", label: "Klasik (bingkai)" },
  { id: "floral", label: "Floral (sudut)" },
  { id: "minimal", label: "Minimal" },
];

/** ISO string <-> value of <input type="datetime-local"> (local time) */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-medium text-foreground">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
  </label>
);

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export const InvitationEditor: React.FC<Props> = ({ weddingId, slug }) => {
  const { data, isLoading } = useInvitation(weddingId);
  const update = useUpdateInvitation(weddingId);
  const [form, setForm] = useState<InvitationInput>(DEFAULT_INVITATION);
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    if (data) {
      const { weddingId: _id, ...rest } = data;
      setForm(rest);
    }
  }, [data]);

  const set = <K extends keyof InvitationInput>(key: K, value: InvitationInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${encodeURI(slug)}/kad`;

  const handleSave = () => {
    update.mutate(form, {
      onSuccess: () => {
        toast.success("Jemputan disimpan");
        setPreviewKey((k) => k + 1);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Gagal menyimpan jemputan"),
    });
  };

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Memuatkan…</div>;

  const presetValue = MUSIC_PRESETS.some((p) => p.url === (form.musicUrl ?? "")) ? (form.musicUrl ?? "") : "custom";

  return (
    <div className="grid flex-1 gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} />
            Aktifkan jemputan digital
          </label>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1.5 text-xs">
            <span className="max-w-[220px] truncate font-mono text-[11px] text-muted-foreground">{inviteUrl}</span>
            <button
              type="button"
              className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast.success("Pautan jemputan disalin");
              }}
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ucapan pembukaan">
            <Input value={form.openingGreeting} onChange={(e) => set("openingGreeting", e.target.value)} />
          </Field>
          <Field label="Gaya kad">
            <select className={selectClass} value={form.cardStyle} onChange={(e) => set("cardStyle", e.target.value as CardStyle)}>
              {CARD_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Nama ibu bapa / penjemput" hint="Satu baris setiap nama">
          <Textarea rows={3} value={form.hostNames} onChange={(e) => set("hostNames", e.target.value)} />
        </Field>
        <Field label="Mesej jemputan">
          <Textarea rows={3} value={form.inviteMessage} onChange={(e) => set("inviteMessage", e.target.value)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mula">
            <Input type="datetime-local" value={toLocalInput(form.eventStart)} onChange={(e) => set("eventStart", fromLocalInput(e.target.value))} />
          </Field>
          <Field label="Tamat">
            <Input type="datetime-local" value={toLocalInput(form.eventEnd)} onChange={(e) => set("eventEnd", fromLocalInput(e.target.value))} />
          </Field>
        </div>

        <Field label="Nama tempat">
          <Input value={form.venueName} onChange={(e) => set("venueName", e.target.value)} />
        </Field>
        <Field label="Alamat">
          <Textarea rows={2} value={form.venueAddress} onChange={(e) => set("venueAddress", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitud (pilihan)" hint="Salin koordinat dari Google Maps untuk lokasi tepat">
            <Input inputMode="decimal" value={form.latitude ?? ""} onChange={(e) => set("latitude", e.target.value || null)} />
          </Field>
          <Field label="Longitud (pilihan)">
            <Input inputMode="decimal" value={form.longitude ?? ""} onChange={(e) => set("longitude", e.target.value || null)} />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Atur cara</span>
            <Button type="button" size="sm" variant="outline" disabled={form.schedule.length >= 15} onClick={() => set("schedule", [...form.schedule, { time: "", title: "" }])}>
              <Plus className="mr-1 size-3.5" /> Tambah
            </Button>
          </div>
          {form.schedule.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input className="w-28 shrink-0" placeholder="11:00 pagi" value={item.time} onChange={(e) => set("schedule", form.schedule.map((s, j) => (j === i ? { ...s, time: e.target.value } : s)))} />
              <Input placeholder="Ketibaan tetamu" value={item.title} onChange={(e) => set("schedule", form.schedule.map((s, j) => (j === i ? { ...s, title: e.target.value } : s)))} />
              <Button type="button" size="icon" variant="ghost" aria-label="Buang" onClick={() => set("schedule", form.schedule.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Hubungi kami</span>
            <Button type="button" size="sm" variant="outline" disabled={form.contacts.length >= 6} onClick={() => set("contacts", [...form.contacts, { name: "", role: "", phone: "" }])}>
              <Plus className="mr-1 size-3.5" /> Tambah
            </Button>
          </div>
          {form.contacts.map((c, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Input placeholder="Nama" value={c.name} onChange={(e) => set("contacts", form.contacts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <Input placeholder="Peranan (Pengantin)" value={c.role} onChange={(e) => set("contacts", form.contacts.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} />
              <Input placeholder="012-3456789" inputMode="tel" value={c.phone} onChange={(e) => set("contacts", form.contacts.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)))} />
              <Button type="button" size="icon" variant="ghost" aria-label="Buang" onClick={() => set("contacts", form.contacts.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <Field label="Muzik latar" hint="Muzik bermula apabila tetamu menekan 'Buka Jemputan'">
          <select
            className={selectClass}
            value={presetValue}
            onChange={(e) => set("musicUrl", e.target.value === "custom" ? "https://" : e.target.value || null)}
          >
            {MUSIC_PRESETS.map((p) => (
              <option key={p.url} value={p.url}>
                {p.label}
              </option>
            ))}
            <option value="custom">Pautan sendiri (https)…</option>
          </select>
          {presetValue === "custom" && (
            <Input className="mt-2" placeholder="https://…/lagu.mp3" value={form.musicUrl ?? ""} onChange={(e) => set("musicUrl", e.target.value || null)} />
          )}
        </Field>

        <Button type="button" onClick={handleSave} disabled={update.isPending} className="w-full sm:w-auto">
          <Save className="mr-1.5 size-4" /> {update.isPending ? "Menyimpan…" : "Simpan jemputan"}
        </Button>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-4 overflow-hidden rounded-[2rem] border-4 border-foreground/80 bg-background shadow-xl">
          <iframe
            key={previewKey}
            title="Pratonton jemputan"
            src={`/${encodeURI(slug)}/kad?preview=subadmin`}
            className="h-[640px] w-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
