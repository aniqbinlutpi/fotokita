import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { checkSlugAvailability, createWedding } from "@/api/wedding";
import { verifyInviteToken, redeemInviteToken, type SubscriptionTier } from "@/api/admin";
import { toast } from "sonner";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Lock,
  Heart,
  ArrowRight,
  ShieldCheck,
  Globe,
  Database,
  Cloud,
  Clock,
  User,
  AlertTriangle,
  MessageCircle,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Wedding } from "@/types/wedding";

interface SubscriberRegisterPageProps {
  inviteToken?: string;
  initialPlan?: SubscriptionTier;
  onSuccess: (wedding: Wedding) => void;
  onCancel?: () => void;
}

const PLAN_DETAILS: Record<string, { title: string; price: string; duration: string; desc: string }> = {
  "12h": { title: "12 Jam", price: "RM 6", duration: "12 Jam", desc: "Akses perkongsian & muat naik tetamu selama 12 jam." },
  "1day": { title: "Sehari Penuh", price: "RM 10", duration: "24 Jam", desc: "Sesuai untuk majlis nikah atau sanding sepanjang hari." },
  "3days": { title: "3 Hari", price: "RM 17", duration: "3 Hari", desc: "Liputan hujung minggu lengkap untuk nikah & resepsi." },
  "1week": { title: "1 Minggu", price: "RM 23", duration: "7 Hari", desc: "Masa tambahan untuk tetamu & keluarga berkongsi foto." },
  "1month": { title: "1 Bulan", price: "RM 46", duration: "30 Hari", desc: "Akses santai untuk muat turun & arkib keluarga." },
  "1year": { title: "1 Tahun Khas", price: "RM 189", duration: "365 Hari", desc: "Khas untuk jurugambar, perancang majlis & pengusaha dewan." },
  standard: { title: "Standard", price: "RM 6", duration: "12 Jam", desc: "Foto tetamu resolusi tinggi." },
  premium: { title: "Pro Studio", price: "RM 10", duration: "24 Jam", desc: "Foto & klip video pantas." },
  vip: { title: "VIP Exclusive", price: "RM 189", duration: "1 Tahun", desc: "Video 4K & arkib tanpa had." },
};

export const SubscriberRegisterPage: React.FC<SubscriberRegisterPageProps> = ({
  inviteToken: propToken,
  initialPlan = "1day",
  onSuccess,
  onCancel,
}) => {
  // Read token from props or URL
  const [token] = useState<string | null>(() => {
    if (propToken) return propToken;
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || null;
  });

  // Token verification states
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(Boolean(token));
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenRemainingHours, setTokenRemainingHours] = useState<number | null>(null);
  const [lockedPlan, setLockedPlan] = useState<SubscriptionTier | null>(null);

  // Form states
  const [coupleName, setCoupleName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [weddingDate, setWeddingDate] = useState(() => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  });
  const [username, setUsername] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>(initialPlan);

  // Success view state (NO AUTO LOGIN)
  const [registeredWedding, setRegisteredWedding] = useState<Wedding | null>(null);

  // Slug check states
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Verify token on mount if provided
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    setIsVerifyingToken(true);
    setTokenError(null);

    verifyInviteToken(token)
      .then((res) => {
        if (!isMounted) return;
        setLockedPlan(res.tier);
        setSelectedPlan(res.tier);
        if (res.clientName) {
          setCoupleName(res.clientName);
          const generated = formatToSlug(res.clientName);
          setSlug(generated);
          if (generated.length >= 3) {
            setIsCheckingSlug(true);
          }
        }
        const hoursLeft = Math.max(0, Math.ceil(res.remainingMs / (1000 * 60 * 60)));
        setTokenRemainingHours(hoursLeft);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setTokenError(
          err?.message ||
            "Link jemputan ini tidak sah, telah digunakan, atau telah melebihi had masa 24 jam."
        );
      })
      .finally(() => {
        if (isMounted) setIsVerifyingToken(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Format string into clean slug
  const formatToSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Auto-generate slug from couple name if not manually edited
  const handleCoupleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCoupleName(val);
    if (!isSlugManuallyEdited) {
      const generated = formatToSlug(val);
      setSlug(generated);
      if (generated.length >= 3) {
        setIsCheckingSlug(true);
      }
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    const cleaned = formatToSlug(e.target.value);
    setSlug(cleaned);
    if (cleaned.length >= 3) {
      setIsCheckingSlug(true);
    }
  };

  // Debounced slug check
  useEffect(() => {
    if (!slug || slug.length < 3) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await checkSlugAvailability(slug);
        setSlugStatus({
          checked: true,
          available: res.available,
          message: res.available
            ? "URL slug ini boleh digunakan!"
            : "URL slug ini telah didaftarkan. Sila cuba slug yang lain.",
        });
      } catch (err: any) {
        setSlugStatus({
          checked: true,
          available: false,
          message: err?.message || "Gagal menyemak URL slug",
        });
      } finally {
        setIsCheckingSlug(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coupleName.trim()) {
      toast.error("Sila masukkan nama pasangan.");
      return;
    }

    if (!slug.trim()) {
      toast.error("Sila tentukan URL galeri (slug).");
      return;
    }

    if (slugStatus && !slugStatus.available) {
      toast.error("URL slug ini tidak sah atau telah diambil.");
      return;
    }

    if (!username.trim()) {
      toast.error("Sila masukkan username untuk akaun Sub-Admin.");
      return;
    }

    if (!adminPin || adminPin.length < 4) {
      toast.error("PIN / Kata laluan Sub-Admin mestilah sekurang-kurangnya 4 aksara.");
      return;
    }

    if (adminPin !== confirmPin) {
      toast.error("Pengesahan PIN / Kata laluan tidak sepadan.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Wedding in wedding-service
      const newWedding = await createWedding({
        name: coupleName.trim(),
        slug: slug.trim(),
        date: new Date(weddingDate).toISOString(),
      });

      // 2. If an invite token was used, redeem it in admin-service (Single-use token burned!)
      if (token) {
        try {
          await redeemInviteToken({
            token,
            username: username.trim(),
            email: subscriberEmail.trim() || `${username.trim()}@fotokita.my`,
            weddingId: newWedding.id,
            weddingSlug: newWedding.slug,
            weddingName: newWedding.name,
          });
        } catch (redeemErr: any) {
          console.warn("Could not redeem invite token in admin-service:", redeemErr);
        }
      }

      // 3. Save admin PIN locally for sub-admin authentication
      try {
        localStorage.setItem(`fotokita_admin_pin_${newWedding.id}`, adminPin);
        localStorage.setItem("fotokita_active_wedding_id", newWedding.id);
        if (subscriberEmail) {
          localStorage.setItem(`fotokita_subscriber_${newWedding.id}`, subscriberEmail);
        }
        localStorage.setItem(`fotokita_subadmin_user_${newWedding.id}`, username.trim());
      } catch {
        // ignore
      }

      toast.success("Pendaftaran berjaya!", {
        description: `Galeri anda sedia dilancarkan di fotokita.my/${newWedding.slug}`,
      });

      // NO AUTO LOGIN: Transition to login prompt view
      setRegisteredWedding(newWedding);
    } catch (err: any) {
      console.error("Failed to register:", err);
      toast.error("Pendaftaran gagal", {
        description:
          err?.message || "URL slug mungkin telah digunakan atau berlaku ralat sambungan pelayan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // State: Token Verifying Loader
  if (isVerifyingToken) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <Loader2 className="size-8 text-accent animate-spin mx-auto" />
          <h2 className="text-lg font-serif">Menyemak Link Jemputan...</h2>
          <p className="text-xs text-muted-foreground">
            Sistem sedang mengesahkan status token pendaftaran dan pakej langganan anda.
          </p>
        </div>
      </div>
    );
  }

  // State: Token Error (Expired >24h or Already Used)
  if (token && tokenError) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center border-rose-500/20 shadow-lg space-y-5">
            <div className="size-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="size-7" />
            </div>

            <div>
              <h2 className="text-xl font-serif font-medium text-foreground">
                Link Pendaftaran Tidak Sah
              </h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {tokenError}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-muted/40 border text-left text-xs space-y-1.5 text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock className="size-3.5 text-accent" />
                <span>Peraturan Keselamatan Token:</span>
              </div>
              <p>&bull; Link hanya sah selama <strong>24 jam</strong> dari masa dijana oleh admin.</p>
              <p>&bull; Setiap link adalah <strong>sekali guna sahaja (Single-Use Token)</strong>.</p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href="https://wa.me/?text=Hai%20Admin%20Fotokita,%20link%20pendaftaran%20saya%20sudah%20tamat%20tempoh%20/%20tidak%20sah.%20Boleh%20dapatkan%20link%20baru?"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
              >
                <MessageCircle className="size-4" />
                <span>Hubungi Admin di WhatsApp</span>
              </a>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full h-10 text-xs uppercase tracking-wider cursor-pointer"
                >
                  Kembali ke Laman Utama
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // State: Registration Success Screen (NO AUTO LOGIN -> Navigate to Sub-Admin Login)
  if (registeredWedding) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="p-8 text-center border-accent/30 shadow-xl space-y-6">
            <div className="size-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-9" />
            </div>

            <div className="space-y-2">
              <Badge variant="outline" className="text-[11px] uppercase tracking-widest text-accent">
                Pendaftaran Berjaya
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-serif text-foreground">
                Galeri Anda Sedia Digunakan!
              </h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Akaun Sub-Admin dan arkib galeri perkahwinan anda telah selamat didaftarkan.
              </p>
            </div>

            {/* Account Summary Card */}
            <div className="p-4 rounded-xl bg-card/60 border border-border text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
                  Nama Pasangan
                </span>
                <span className="font-medium text-foreground">{registeredWedding.name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
                  URL Rasmi Galeri
                </span>
                <span className="font-mono text-accent">fotokita.my/{registeredWedding.slug}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
                  Username Sub-Admin
                </span>
                <span className="font-mono font-medium text-foreground">@{username}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
                  Pakej Langganan
                </span>
                <Badge variant="secondary" className="capitalize text-[10px]">
                  {PLAN_DETAILS[selectedPlan]?.title || selectedPlan} ({PLAN_DETAILS[selectedPlan]?.price || ""})
                </Badge>
              </div>
            </div>

            {/* Instruction requiring manual login */}
            <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground flex items-start gap-2 text-left">
              <Lock className="size-4 text-accent shrink-0 mt-0.5" />
              <span>
                Demi keselamatan akaun, sila <strong>log masuk semula</strong> menggunakan PIN / kata laluan Sub-Admin anda untuk mula mengurus galeri.
              </span>
            </div>

            {/* Action button to proceed to Sub-Admin Login */}
            <Button
              type="button"
              onClick={() => onSuccess(registeredWedding)}
              className="w-full h-12 text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-md gap-2"
            >
              <LogIn className="size-4" />
              <span>Pergi ke Log Masuk Sub-Admin</span>
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Normal Registration Form
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1 text-[11px] uppercase tracking-widest text-accent">
            <Sparkles className="size-3.5" />
            Pendaftaran Sub-Admin Galeri
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground tracking-wide font-normal">
            Daftar Galeri Perkahwinan Anda
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Lengkapkan maklumat di bawah untuk melancarkan galeri digital eksklusif anda.
          </p>

          {/* Active 24h Token Banner */}
          {token && tokenRemainingHours !== null && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
              <Clock className="size-3.5" />
              <span>Link Sah: Berbaki kira-kira <strong>{tokenRemainingHours} jam</strong> (Single-Use)</span>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <Card className="p-3 bg-card/60 flex items-center gap-2.5 flex-row">
            <Globe className="size-4 text-accent shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Custom URL</p>
              <p className="text-xs font-medium text-foreground">fotokita.my/slug</p>
            </div>
          </Card>

          <Card className="p-3 bg-card/60 flex items-center gap-2.5 flex-row">
            <Cloud className="size-4 text-accent shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cloud Storage</p>
              <p className="text-xs font-medium text-foreground">Zero Egress Fees</p>
            </div>
          </Card>

          <Card className="p-3 bg-card/60 flex items-center gap-2.5 flex-row">
            <Database className="size-4 text-accent shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">PostgreSQL</p>
              <p className="text-xs font-medium text-foreground">Tenant Isolated</p>
            </div>
          </Card>
        </div>

        {/* Registration Form Card */}
        <Card className="bg-card p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Couple Names */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                Nama Pasangan Pengantin *
              </label>
              <div className="relative">
                <Input
                  required
                  placeholder="cth. Afiq & Wieam"
                  value={coupleName}
                  onChange={handleCoupleNameChange}
                  className="pr-10"
                />
                <Heart className="size-4 absolute right-3.5 top-3 text-accent/60 pointer-events-none" />
              </div>
            </div>

            {/* 2. Custom URL Slug with Realtime Checking */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest font-medium text-muted-foreground">
                  URL Galeri (Mestilah Unik) *
                </label>
                <span className="text-[11px] text-accent font-mono">
                  fotokita.my/{slug || "slug-anda"}
                </span>
              </div>

              <div className="relative flex rounded-lg shadow-2xs">
                <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-input bg-muted/50 text-xs font-mono text-muted-foreground select-none">
                  fotokita.my/
                </span>
                <input
                  type="text"
                  required
                  placeholder="afiq-dan-wieam"
                  value={slug}
                  onChange={handleSlugChange}
                  className="flex-1 px-4 py-2.5 bg-background/50 border border-input rounded-r-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
                />
                <div className="absolute right-3 top-3 flex items-center">
                  {isCheckingSlug ? (
                    <Loader2 className="size-4 text-accent animate-spin" />
                  ) : slugStatus?.checked ? (
                    slugStatus.available ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="size-4 text-rose-500" />
                    )
                  ) : null}
                </div>
              </div>

              {/* Status Feedback */}
              {slugStatus && (
                <div
                  className={`mt-2 text-xs flex items-center gap-1.5 ${
                    slugStatus.available
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {slugStatus.available ? (
                    <CheckCircle2 className="size-3.5 shrink-0" />
                  ) : (
                    <XCircle className="size-3.5 shrink-0" />
                  )}
                  <span>{slugStatus.message}</span>
                </div>
              )}
            </div>

            {/* 3. Wedding Date */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                Tarikh Majlis Perkahwinan *
              </label>
              <div className="relative">
                <Input
                  type="date"
                  required
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="pr-10"
                />
                <Calendar className="size-4 absolute right-3.5 top-3 text-accent/60 pointer-events-none" />
              </div>
            </div>

            {/* 4. Storage Plan based on Tier */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest font-medium text-muted-foreground">
                  Pakej Langganan
                </label>
                {lockedPlan && (
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                    Ditetapkan oleh Admin (24 Jam Token)
                  </Badge>
                )}
              </div>

              {lockedPlan ? (
                <div className="p-4 rounded-xl border border-accent/40 bg-accent/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base font-semibold text-foreground">
                        {PLAN_DETAILS[selectedPlan]?.title || selectedPlan}
                      </span>
                      <Badge variant="outline" className="text-xs text-accent font-semibold border-accent/40 bg-accent/5">
                        {PLAN_DETAILS[selectedPlan]?.price || ""}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {PLAN_DETAILS[selectedPlan]?.desc || "Pakej langganan yang telah disahkan."}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Badge variant="outline" className="text-[11px] font-medium border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                      Disahkan &bull; {PLAN_DETAILS[selectedPlan]?.duration || "Aktif"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(["12h", "1day", "3days", "1week", "1month", "1year"] as const).map((tierKey) => {
                    const info = PLAN_DETAILS[tierKey];
                    return (
                      <div
                        key={tierKey}
                        onClick={() => setSelectedPlan(tierKey)}
                        className={`cursor-pointer p-3 rounded-lg border transition-all ${
                          selectedPlan === tierKey
                            ? "border-accent bg-accent/10 ring-1 ring-accent"
                            : "border-border hover:border-accent/40"
                        }`}
                      >
                        <div className="font-serif text-sm font-semibold">{info.title}</div>
                        <div className="text-xs text-accent font-medium mt-0.5">{info.price}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                          {info.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Sub-Admin Username & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                  Username Sub-Admin *
                </label>
                <div className="relative">
                  <Input
                    required
                    placeholder="cth. afiq_wieam"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    className="pr-10 font-mono text-sm"
                  />
                  <User className="size-4 absolute right-3.5 top-3 text-accent/60 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                  Emel Pengesahan *
                </label>
                <Input
                  required
                  type="email"
                  placeholder="pasangan@emel.com"
                  value={subscriberEmail}
                  onChange={(e) => setSubscriberEmail(e.target.value)}
                />
              </div>
            </div>

            {/* 6. Sub-Admin Password / PIN & Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                  PIN / Kata Laluan Sub-Admin *
                </label>
                <div className="relative">
                  <Input
                    required
                    type="password"
                    placeholder="4-8 digit / kata laluan"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="pr-10 font-mono"
                  />
                  <Lock className="size-3.5 absolute right-3.5 top-3 text-accent/60 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                  Sahkan PIN / Kata Laluan *
                </label>
                <div className="relative">
                  <Input
                    required
                    type="password"
                    placeholder="Ulang kata laluan"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="pr-10 font-mono"
                  />
                  <Lock className="size-3.5 absolute right-3.5 top-3 text-accent/60 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full sm:w-auto h-11 px-5 uppercase text-xs tracking-wider cursor-pointer"
                >
                  Batal
                </Button>
              )}

              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  (slugStatus !== null && !slugStatus.available)
                }
                className="w-full sm:flex-1 h-11 uppercase text-xs tracking-widest font-semibold cursor-pointer shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Mendaftar Galeri...
                  </>
                ) : (
                  <>
                    <span>Daftar Akaun Sub-Admin</span>
                    <ArrowRight data-icon="inline-end" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Security Assurance Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Akaun anda dilindungi dengan pengesahan enkripsi dan pangkalan data terasing.</span>
        </div>
      </motion.div>
    </div>
  );
};
