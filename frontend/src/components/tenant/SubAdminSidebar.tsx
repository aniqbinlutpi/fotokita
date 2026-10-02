import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Sparkles,
  Heart,
  Calendar,
  Palette,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  Sliders,
  Type,
  Flame,
  Globe,
  Move,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { TenantAccount, TenantCustomization } from "@/api/tenant";
import {
  WEDDING_FONT_OPTIONS,
  PARTNER_SIZE_CONFIG,
  EYEBROW_SIZE_CONFIG,
  DATE_SIZE_CONFIG,
  QUOTE_SIZE_CONFIG,
  parsePartnerSize,
  parseEyebrowSize,
  parseDateSize,
  parseQuoteSize,
} from "@/lib/typography";

interface SubAdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tenant: TenantAccount | null;
  customization: TenantCustomization;
  onChangeCustomization: (updated: Partial<TenantCustomization>) => void;
  onSave: () => void;
  isSaving: boolean;
  onLogout: () => void;
  onOpenLiveGuestView: () => void;
}

const THEME_OPTIONS = [
  {
    id: "warmGold",
    name: "Warm Gold & Bronze",
    desc: "Lustrous antique champagne & mocha gold",
    colors: ["#1F1712", "#8C6D48", "#C9AA7C", "#F5EADB"],
  },
  {
    id: "roseRomance",
    name: "Rose Blush & Wine",
    desc: "Romantic dusty rose & ruby mocha",
    colors: ["#280D16", "#9C435A", "#DFA4AF", "#FDF2F4"],
  },
  {
    id: "emerald",
    name: "Emerald Botanical",
    desc: "Lush botanical moss & mint gold",
    colors: ["#0D211A", "#1A4335", "#3D7A65", "#94C9B4"],
  },
  {
    id: "midnight",
    name: "Midnight Starlight",
    desc: "Editorial obsidian & platinum sapphire",
    colors: ["#0A0E17", "#152238", "#4F678F", "#B2C4DF"],
  },
];

interface TypographyControlProps {
  label: string;
  icon?: React.ReactNode;
  fontValue?: string;
  defaultFont: string;
  onFontChange: (fontId: string) => void;
  sizeValue?: string;
  defaultSize: number;
  min?: number;
  step?: number;
  parseValue: (val?: string) => number;
  onSizeChange: (sizeStr: string) => void;
  filterCategories?: ("serif" | "script" | "sans")[];
  position?: { x: number; y: number };
  onResetPosition?: () => void;
}

const TypographyControl: React.FC<TypographyControlProps> = ({
  label,
  icon,
  fontValue,
  defaultFont,
  onFontChange,
  sizeValue,
  defaultSize,
  min = 1,
  step = 1,
  parseValue,
  onSizeChange,
  filterCategories,
  position,
  onResetPosition,
}) => {
  const activeFontId = fontValue || defaultFont;
  const currentNum = sizeValue ? parseValue(sizeValue) : defaultSize;
  const selectedFont = WEDDING_FONT_OPTIONS.find((f) => f.id === activeFontId);
  const [typedValue, setTypedValue] = React.useState<string | null>(null);

  const availableFonts = filterCategories
    ? WEDDING_FONT_OPTIONS.filter((f) => filterCategories.includes(f.category))
    : WEDDING_FONT_OPTIONS;

  const handleNumChange = (newVal: number) => {
    const safeVal = Math.max(min, Math.round(newVal));
    setTypedValue(null);
    onSizeChange(String(safeVal));
  };

  return (
    <div className="p-2.5 rounded-lg bg-sidebar-accent/30 border border-sidebar-border space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
          {icon || <Type className="size-3 text-accent" />}
          {label}
        </span>
        <span className="text-[10px] text-muted-foreground truncate max-w-[125px]">
          {selectedFont?.name || activeFontId}
        </span>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground block">Font Style</label>
        <select
          value={activeFontId}
          onChange={(e) => onFontChange(e.target.value)}
          className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          <optgroup label="Editorial & Regal Serifs">
            {availableFonts
              .filter((f) => f.category === "serif")
              .map((f) => (
                <option key={f.id} value={f.id} style={{ fontFamily: f.cssFamily }}>
                  {f.name} — {f.description}
                </option>
              ))}
          </optgroup>
          <optgroup label="Romantic Calligraphy & Scripts">
            {availableFonts
              .filter((f) => f.category === "script")
              .map((f) => (
                <option key={f.id} value={f.id} style={{ fontFamily: f.cssFamily }}>
                  {f.name} — {f.description}
                </option>
              ))}
          </optgroup>
          <optgroup label="Modern Minimalist Sans">
            {availableFonts
              .filter((f) => f.category === "sans")
              .map((f) => (
                <option key={f.id} value={f.id} style={{ fontFamily: f.cssFamily }}>
                  {f.name} — {f.description}
                </option>
              ))}
          </optgroup>
        </select>
      </div>

      {/* Direct Numeric Font Size Input (No slider) */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground block">Font Size</label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleNumChange(currentNum - step)}
            disabled={currentNum <= min}
            className="size-8 flex items-center justify-center rounded-md border border-input bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer text-sm select-none shrink-0 font-medium"
            title="Decrease font size"
          >
            -
          </button>

          <div className="relative flex-1">
            <input
              type="number"
              min={min}
              value={typedValue !== null ? typedValue : currentNum}
              onChange={(e) => {
                const str = e.target.value;
                setTypedValue(str);
                const val = parseInt(str, 10);
                if (!isNaN(val) && val >= min) {
                  onSizeChange(String(val));
                }
              }}
              onBlur={() => {
                setTypedValue(null);
                if (!sizeValue || isNaN(Number(sizeValue)) || Number(sizeValue) < min) {
                  onSizeChange(String(defaultSize));
                }
              }}
              placeholder={String(defaultSize)}
              className="w-full h-8 rounded-md border border-input bg-background px-3 pr-8 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="absolute right-2.5 top-2 text-[11px] text-muted-foreground select-none pointer-events-none font-sans">
              px
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleNumChange(currentNum + step)}
            className="size-8 flex items-center justify-center rounded-md border border-input bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-sm select-none shrink-0 font-medium"
            title="Increase font size"
          >
            +
          </button>
        </div>
      </div>

      {position && (position.x !== 0 || position.y !== 0) && (
        <div className="flex items-center justify-between text-[10px] text-accent-foreground bg-accent/15 px-2 py-1 rounded-md border border-accent/30 animate-in fade-in-50">
          <span className="flex items-center gap-1 font-mono">
            <Move className="size-2.5 text-accent" />
            Position: {position.x > 0 ? `+${position.x}` : position.x}px, {position.y > 0 ? `+${position.y}` : position.y}px
          </span>
          {onResetPosition && (
            <button
              type="button"
              onClick={onResetPosition}
              className="text-[9px] hover:underline flex items-center gap-0.5 cursor-pointer text-muted-foreground hover:text-foreground"
              title="Reset position to default"
            >
              <RotateCcw className="size-2.5" />
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const SubAdminSidebar: React.FC<SubAdminSidebarProps> = ({
  tenant,
  customization,
  onChangeCustomization,
  onSave,
  isSaving,
  onLogout,
  onOpenLiveGuestView,
  ...props
}) => {
  const [copied, setCopied] = React.useState(false);

  const weddingSlug = customization.slug || tenant?.weddingSlug || "wan-three";
  const guestUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/?slug=${encodeURIComponent(weddingSlug)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasCustomPositions = customization.textPositions
    ? Object.values(customization.textPositions).some((p) => p && (p.x !== 0 || p.y !== 0))
    : false;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border" {...props}>
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border p-3.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3">
              <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-[#2F2926] text-[#F5EFEB] dark:bg-[#F5EFEB] dark:text-[#2F2926] shadow-sm">
                <Heart className="size-5 fill-current" />
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-serif text-sm font-semibold tracking-wide text-sidebar-foreground">
                  {tenant?.weddingName || "Wedding Portal"}
                </span>
                <span className="truncate text-[10px] text-muted-foreground flex items-center gap-1 font-sans">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-accent/40 text-accent">
                    Sub-Admin Portal
                  </Badge>
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Guest Link Pill */}
        <div className="mt-3 p-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border flex items-center justify-between gap-1.5 text-xs">
          <div className="truncate text-muted-foreground font-mono text-[11px]">
            /?slug={weddingSlug}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy guest link"
              className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={onOpenLiveGuestView}
              title="Open guest gallery in new tab"
              className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ExternalLink className="size-3.5" />
            </button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="space-y-4 px-3 py-3">
        {/* Canvas Drag & Placement Status / Reset */}
        {hasCustomPositions ? (
          <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/25 space-y-2 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Move className="size-3 text-accent" />
                <span>Text Placement</span>
              </span>
              <span className="text-[9px] bg-accent/20 text-accent font-semibold px-1.5 py-0.5 rounded">
                Custom Positions
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Text elements have been repositioned on the preview canvas.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChangeCustomization({ textPositions: {} })}
              className="w-full h-7 text-[11px] cursor-pointer gap-1.5 border-dashed"
            >
              <RotateCcw className="size-3" />
              <span>Reset All Positions</span>
            </Button>
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-muted/40 border border-border/60 text-[10px] text-muted-foreground flex items-center gap-2">
            <Move className="size-3.5 text-accent shrink-0" />
            <span>Click & drag any text directly on the canvas to place it anywhere.</span>
          </div>
        )}

        {/* Section 1: Names & Identity */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-medium">
            <Type className="size-3.5" />
            <span>Couple Names & Date</span>
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-sans block">Partner 1 (Groom / Bride)</label>
              <Input
                value={customization.partner1}
                onChange={(e) => onChangeCustomization({ partner1: e.target.value })}
                placeholder="e.g. Wan"
                className="h-8 text-xs bg-sidebar-accent/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-sans block">Partner 2 (Bride / Groom)</label>
              <Input
                value={customization.partner2}
                onChange={(e) => onChangeCustomization({ partner2: e.target.value })}
                placeholder="e.g. Three"
                className="h-8 text-xs bg-sidebar-accent/30"
              />
            </div>

            {/* Couple Names Typography */}
            <TypographyControl
              label="Names Typography"
              icon={<Heart className="size-3 text-accent" />}
              fontValue={customization.partnerFont}
              defaultFont="cormorant"
              onFontChange={(fontId) => onChangeCustomization({ partnerFont: fontId })}
              sizeValue={customization.partnerSize}
              defaultSize={PARTNER_SIZE_CONFIG.defaultValue}
              min={PARTNER_SIZE_CONFIG.min}
              step={PARTNER_SIZE_CONFIG.step}
              parseValue={parsePartnerSize}
              onSizeChange={(sizeStr) => onChangeCustomization({ partnerSize: sizeStr })}
              position={customization.textPositions?.partner1 || customization.textPositions?.partner2}
              onResetPosition={() => {
                const next = { ...(customization.textPositions || {}) };
                delete next.partner1;
                delete next.partner2;
                onChangeCustomization({ textPositions: next });
              }}
            />

            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-sans flex items-center gap-1">
                <Calendar className="size-3" />
                <span>Wedding Date</span>
              </label>
              <Input
                type="date"
                value={customization.weddingDate}
                onChange={(e) => onChangeCustomization({ weddingDate: e.target.value })}
                className="h-8 text-xs bg-sidebar-accent/30"
              />
            </div>

            {/* Wedding Date Typography */}
            <TypographyControl
              label="Date Typography"
              icon={<Calendar className="size-3 text-accent" />}
              fontValue={customization.dateFont}
              defaultFont="inter"
              onFontChange={(fontId) => onChangeCustomization({ dateFont: fontId })}
              sizeValue={customization.dateSize}
              defaultSize={DATE_SIZE_CONFIG.defaultValue}
              min={DATE_SIZE_CONFIG.min}
              step={DATE_SIZE_CONFIG.step}
              parseValue={parseDateSize}
              onSizeChange={(sizeStr) => onChangeCustomization({ dateSize: sizeStr })}
              position={customization.textPositions?.date}
              onResetPosition={() => {
                const next = { ...(customization.textPositions || {}) };
                delete next.date;
                onChangeCustomization({ textPositions: next });
              }}
            />

            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-sans flex items-center gap-1">
                <Globe className="size-3" />
                <span>Gallery URL Slug</span>
              </label>
              <div className="flex items-center rounded-md border border-input bg-sidebar-accent/30 px-2 h-8 text-xs font-mono text-muted-foreground">
                <span className="shrink-0 select-none text-[11px]">/?slug=</span>
                <input
                  value={customization.slug ?? tenant?.weddingSlug ?? ""}
                  onChange={(e) =>
                    onChangeCustomization({
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-&]/g, ""),
                    })
                  }
                  placeholder="e.g. wan-three"
                  className="w-full bg-transparent pl-1 text-foreground focus:outline-none"
                />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Section 2: Header Deco & Eyebrow */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-medium">
            <Sliders className="size-3.5" />
            <span>Hero Eyebrow & Quotes</span>
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground block">Top Eyebrow Text</label>
              <Input
                value={customization.eyebrow}
                onChange={(e) => onChangeCustomization({ eyebrow: e.target.value })}
                placeholder="- WEDDING ARCHIVE -"
                className="h-8 text-xs bg-sidebar-accent/30 font-mono"
              />
            </div>

            {/* Eyebrow Typography */}
            <TypographyControl
              label="Eyebrow Typography"
              icon={<Sliders className="size-3 text-accent" />}
              fontValue={customization.eyebrowFont}
              defaultFont="inter"
              onFontChange={(fontId) => onChangeCustomization({ eyebrowFont: fontId })}
              sizeValue={customization.eyebrowSize}
              defaultSize={EYEBROW_SIZE_CONFIG.defaultValue}
              min={EYEBROW_SIZE_CONFIG.min}
              step={EYEBROW_SIZE_CONFIG.step}
              parseValue={parseEyebrowSize}
              onSizeChange={(sizeStr) => onChangeCustomization({ eyebrowSize: sizeStr })}
              position={customization.textPositions?.eyebrow}
              onResetPosition={() => {
                const next = { ...(customization.textPositions || {}) };
                delete next.eyebrow;
                onChangeCustomization({ textPositions: next });
              }}
            />

            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground block">Invitation Quote / Tagline</label>
              <textarea
                value={customization.tagline}
                onChange={(e) => onChangeCustomization({ tagline: e.target.value })}
                rows={2}
                placeholder="Every candid smile..."
                className="w-full text-xs rounded-md border border-input bg-sidebar-accent/30 p-2 font-serif focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Quote Typography */}
            <TypographyControl
              label="Quote Typography"
              icon={<Type className="size-3 text-accent" />}
              fontValue={customization.quoteFont}
              defaultFont="cormorant"
              onFontChange={(fontId) => onChangeCustomization({ quoteFont: fontId })}
              sizeValue={customization.quoteSize}
              defaultSize={QUOTE_SIZE_CONFIG.defaultValue}
              min={QUOTE_SIZE_CONFIG.min}
              step={QUOTE_SIZE_CONFIG.step}
              parseValue={parseQuoteSize}
              onSizeChange={(sizeStr) => onChangeCustomization({ quoteSize: sizeStr })}
              position={customization.textPositions?.quote}
              onResetPosition={() => {
                const next = { ...(customization.textPositions || {}) };
                delete next.quote;
                onChangeCustomization({ textPositions: next });
              }}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Section 3: Decoration & Color Theme */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-medium">
            <Palette className="size-3.5" />
            <span>Theme & Deco Style</span>
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2.5 pt-2">
            <div className="grid grid-cols-1 gap-2">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = customization.themePalette === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onChangeCustomization({ themePalette: theme.id })}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-accent bg-accent/10 shadow-xs ring-1 ring-accent/30"
                        : "border-sidebar-border hover:border-sidebar-border/80 hover:bg-sidebar-accent/30"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium text-foreground">{theme.name}</p>
                      <p className="text-[10px] text-muted-foreground">{theme.desc}</p>
                    </div>
                    <div className="flex -space-x-1 shrink-0">
                      {theme.colors.map((c, i) => (
                        <span
                          key={i}
                          className="size-3.5 rounded-full border border-background shadow-2xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fireworks Toggle */}
            <div className="pt-2 flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/40 border border-sidebar-border">
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-amber-500" />
                <span className="text-xs font-medium">Fireworks Particles</span>
              </div>
              <Button
                variant={customization.fireworksEnabled ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  onChangeCustomization({ fireworksEnabled: !customization.fireworksEnabled })
                }
                className="h-6 text-[10px] px-2.5 cursor-pointer"
              >
                {customization.fireworksEnabled ? "Active" : "Disabled"}
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="w-full text-xs font-medium shadow-sm cursor-pointer"
          size="sm"
        >
          <Sparkles className="size-3.5 mr-1.5" />
          {isSaving ? "Saving Deco..." : "Save Customization"}
        </Button>

        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
          <div className="grid leading-tight truncate">
            <span className="truncate font-medium text-foreground">
              @{tenant?.username || "subadmin"}
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              {tenant?.email || "tenant@fotokita.my"}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Sign out of Sub-Admin Portal"
            className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-background transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};
