// src/app/(admin)/admin/exhibits/[id]/ExhibitDetailContent.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { useAdminExhibitDetail } from "@/hooks/admin/useAdminExhibitDetail";
import { getAdminExhibits } from "@/services/admin.service";
import { getExhibitTrend, type ExhibitTrendPoint } from "@/services/analytics.service";
import { validateMediaFile, uploadToCloudinary } from "@/services/cloudinary.service";
import { useToast } from "@/stores/ToastContext";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import ContentEditor from "@/components/admin/ContentEditor";
import { Spinner } from "@/components/ui/Spinner";
import MediaUploader from "@/components/admin/MediaUploader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LabGameFormModal from "@/components/admin/LabGameFormModal";
import { useAdminLabGames } from "@/hooks/admin/useAdminLabGames";
import type { AdminLabGame } from "@/types/admin.types";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";

// --- Types & Tooltip ---
interface ExhibitDetailContentProps {
  id: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-outline-variant/30 rounded-xl p-3.5 shadow-[0px_4px_20px_rgba(0,0,0,0.08)]">
        <p className="font-label-sm text-xs font-bold text-outline uppercase tracking-wider mb-2 select-none">
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: item.color || item.stroke || item.fill }}
                />
                {item.name}
              </span>
              <span className="font-bold text-xs text-on-surface">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

const TABS = [
  { id: "tab-info", label: "Info", icon: "info" },
  { id: "tab-edukasi", label: "Materi Edukasi", icon: "menu_book" },
  { id: "tab-media", label: "Media", icon: "library_music" },
  { id: "tab-lab", label: "Lab Interaktif", icon: "science" },
  { id: "tab-qr", label: "QR Code", icon: "qr_code_2" },
  { id: "tab-statistik", label: "Statistik", icon: "bar_chart" },
];

export default function ExhibitDetailContent({ id }: ExhibitDetailContentProps) {
  const router = useRouter();
  
  // Custom Hook
  const {
    exhibit,
    isLoading,
    error,
    isSavingInfo,
    isSavingContent,
    isDeletingContent,
    isDeletingMedia,
    activeTab,
    setActiveTab,
    refetch,
    handleUpdateInfo,
    handleSaveContent,
    handleDeleteContent,
    handleDeleteMedia,
  } = useAdminExhibitDetail(id);

  // Lab Games Custom Hook
  const {
    labGames,
    isLoading: isLoadingLab,
    isSaving: isSavingLab,
    isDeleting: isDeletingLab,
    isDuplicating,
    createGame,
    updateGame,
    deleteGame,
    toggleActive,
    duplicateGame,
  } = useAdminLabGames(id);

  // Lab Game States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<AdminLabGame | null>(null);
  const [gameToDelete, setGameToDelete] = useState<number | null>(null);

  // Toast and File Input Refs
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Main Photo States
  const [mainPhotoUrl, setMainPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- Dynamic Zones List ---
  const [zonesList, setZonesList] = useState<string[]>([
    "Zona Mamalia",
    "Zona Primata",
    "Zona Reptil",
    "Zona Unggas",
    "Zona Akuatik",
    "Zona Amfibi",
  ]);

  // --- Accordion State ---
  const [openAccordion, setOpenAccordion] = useState<"CHILD" | "TEEN" | "ADULT" | null>("CHILD");

  // --- Trend Chart State ---
  const [trendData, setTrendData] = useState<ExhibitTrendPoint[]>([]);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);

  // --- Info Form State ---
  const [infoForm, setInfoForm] = useState({
    name: "",
    zone: "",
    customZone: "",
    description: "",
  });
  const [infoErrors, setInfoErrors] = useState<Record<string, string>>({});

  // Fetch zones list dynamically
  useEffect(() => {
    async function loadExistingZones() {
      const result = await getAdminExhibits();
      if (result.success && result.data) {
        const existingZones = Array.from(
          new Set(result.data.map((ex) => ex.zone_name))
        ).filter((z): z is string => typeof z === "string" && z.trim() !== "");

        const combined = Array.from(
          new Set([
            "Zona Mamalia",
            "Zona Primata",
            "Zona Reptil",
            "Zona Unggas",
            "Zona Akuatik",
            "Zona Amfibi",
            ...existingZones,
          ])
        ).sort();
        setZonesList(combined);
      }
    }
    loadExistingZones();
  }, []);

  // Fetch trend data for statistics tab
  useEffect(() => {
    if (activeTab === "tab-statistik") {
      async function fetchTrend() {
        setIsLoadingTrend(true);
        const res = await getExhibitTrend(id);
        if (res.success && res.data) {
          setTrendData(res.data);
        }
        setIsLoadingTrend(false);
      }
      fetchTrend();
    }
  }, [activeTab, id]);

  // Initialize Info Form once exhibit details are loaded
  useEffect(() => {
    if (exhibit) {
      const isPredefined = zonesList.includes(exhibit.zone_name);
      setInfoForm({
        name: exhibit.name,
        zone: isPredefined ? exhibit.zone_name : "Lainnya",
        customZone: isPredefined ? "" : exhibit.zone_name,
        description: exhibit.description || "",
      });
    }
  }, [exhibit, zonesList]);


  // --- Derived Engagement Statistics ---
  const derivedStats = useMemo(() => {
    if (!trendData || trendData.length === 0) return null;
    
    let totalVis = 0;
    let totalInt = 0;
    let maxVis = 0;
    let maxVisDay = "";
    let maxInt = 0;
    let maxIntDay = "";

    trendData.forEach((pt) => {
      totalVis += pt.visitors;
      totalInt += pt.interactions;
      
      if (pt.visitors > maxVis) {
        maxVis = pt.visitors;
        maxVisDay = pt.name;
      }
      if (pt.interactions > maxInt) {
        maxInt = pt.interactions;
        maxIntDay = pt.name;
      }
    });

    const avgInteractionsPerVisitor = totalVis > 0 ? (totalInt / totalVis).toFixed(1) : "0";
    
    // Engagement Index based on interaction density
    let engagementLevel = "Rendah";
    let engagementColor = "text-rose-600 bg-rose-500/10 border-rose-500/20";
    const ratio = Number(avgInteractionsPerVisitor);
    if (ratio >= 2.5) {
      engagementLevel = "Sangat Tinggi";
      engagementColor = "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
    } else if (ratio >= 1.5) {
      engagementLevel = "Tinggi";
      engagementColor = "text-teal-600 bg-teal-500/10 border-teal-500/20";
    } else if (ratio >= 0.8) {
      engagementLevel = "Sedang";
      engagementColor = "text-amber-600 bg-amber-500/10 border-amber-500/20";
    }

    return {
      totalVis,
      totalInt,
      maxVis,
      maxVisDay,
      maxInt,
      maxIntDay,
      avgInteractionsPerVisitor,
      engagementLevel,
      engagementColor
    };
  }, [trendData]);

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
        <Spinner className="w-12 h-12 text-primary" />
        <p className="font-label-md text-label-md text-on-surface-variant">Memuat data detail kandang...</p>
      </div>
    );
  }

  if (error || !exhibit) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 gap-4">
        <span className="material-symbols-outlined text-error text-5xl select-none">error_outline</span>
        <h3 className="text-headline-md font-headline-md font-bold text-on-surface">Gagal Memuat Halaman</h3>
        <p className="text-body-sm text-on-surface-variant max-w-md">
          {error || "Kandang tidak ditemukan atau terjadi kesalahan server."}
        </p>
        <Button onClick={() => router.push(ROUTES.admin.exhibits)} className="rounded-xl px-5 font-semibold">
          Kembali ke Daftar Kandang
        </Button>
      </div>
    );
  }

  // --- Handlers ---
  function handleInfoChange(field: keyof typeof infoForm) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      setInfoForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (infoErrors[field]) {
        setInfoErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };
  }

  function handleZoneSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setInfoForm((prev) => ({
      ...prev,
      zone: val,
      customZone: val !== "Lainnya" ? "" : prev.customZone,
    }));
    if (infoErrors.zone) {
      setInfoErrors((prev) => ({ ...prev, zone: "" }));
    }
  }

  // Validation function
  function validateInfoForm() {
    const errs: Record<string, string> = {};
    if (!infoForm.name.trim()) {
      errs.name = "Nama kandang wajib diisi";
    }
    if (!infoForm.zone) {
      errs.zone = "Zona wajib dipilih";
    } else if (infoForm.zone === "Lainnya" && !infoForm.customZone.trim()) {
      errs.customZone = "Nama zona kustom wajib diisi";
    }
    setInfoErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateInfoForm()) return;

    const finalZone = infoForm.zone === "Lainnya" ? infoForm.customZone.trim() : infoForm.zone;
    await handleUpdateInfo(
      infoForm.name.trim(),
      finalZone,
      infoForm.description.trim(),
      mainPhotoUrl
    );
  }

  // Handle uploading main photo directly to Cloudinary
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMediaFile(file, "IMAGE_INFOGRAPHIC");
    if (!validation.valid) {
      toast.error(validation.error || "File gambar tidak valid.");
      return;
    }

    setIsUploadingPhoto(true);
    setUploadProgress(0);

    try {
      const secureUrl = await uploadToCloudinary(file, "IMAGE_INFOGRAPHIC", (percent: number) => {
        setUploadProgress(percent);
      });
      setMainPhotoUrl(secureUrl);
      toast.success("Foto utama berhasil diunggah! Klik Simpan Perubahan untuk menyimpan.");
    } catch (err: any) {
      console.error("Cloudinary upload error:", err);
      toast.error(err.message || "Gagal mengunggah foto utama.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadQrCode = () => {
    const canvas = document.getElementById("exhibit-qrcode-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode-${exhibit.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* --- Breadcrumbs --- */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <nav aria-label="Breadcrumb" className="flex font-label-sm text-label-sm text-on-surface-variant">
          <ol className="inline-flex items-center gap-2">
            <li>
              <button
                onClick={() => router.push(ROUTES.admin.dashboard)}
                className="hover:text-primary font-semibold transition-colors cursor-pointer"
              >
                ZooLogix Admin
              </button>
            </li>
            <li>
              <span className="material-symbols-outlined text-outline/50 select-none" style={{ fontSize: "14px" }}>
                chevron_right
              </span>
            </li>
            <li>
              <button
                onClick={() => router.push(ROUTES.admin.exhibits)}
                className="hover:text-primary font-semibold transition-colors cursor-pointer"
              >
                Kandang
              </button>
            </li>
            <li>
              <span className="material-symbols-outlined text-outline/50 select-none" style={{ fontSize: "14px" }}>
                chevron_right
              </span>
            </li>
            <li aria-current="page">
              <span className="text-primary font-bold">{exhibit.name}</span>
            </li>
          </ol>
        </nav>
        <button
          onClick={() => router.push(ROUTES.admin.exhibits)}
          className="flex items-center gap-2 rounded-xl border border-outline-variant/60 px-4 py-2 font-label-sm text-label-sm font-semibold text-outline hover:text-on-surface hover:bg-surface-container-low transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined select-none" style={{ fontSize: "18px" }}>
            arrow_back
          </span>
          Kembali
        </button>
      </div>

      {/* --- Header & Tabs Shell --- */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {exhibit.name}
              </h2>
              {exhibit.is_active ? (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-wider select-none">
                  Aktif
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-gray-500/10 text-gray-500 border border-gray-500/20 uppercase tracking-wider select-none">
                  Nonaktif
                </span>
              )}
            </div>
            <p className="text-body-sm text-outline/80 mt-1 flex items-center gap-1 select-none">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {exhibit.zone_name}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex overflow-x-auto border-b border-outline-variant/30 mt-6 hide-scrollbar gap-1">
          {TABS.map((t) => {
            const isTabActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "px-4 py-2.5 font-label-md text-label-md border-b-2 transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer font-semibold",
                  isTabActive
                    ? "border-primary text-primary"
                    : "border-transparent text-outline hover:text-primary hover:border-primary/30"
                )}
              >
                <span className="material-symbols-outlined select-none" style={{ fontSize: "18px" }}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Tab Contents Panel --- */}
      <div className="transition-all duration-300">
        
        {/* --- Tab 1: Info --- */}
        {activeTab === "tab-info" && (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm max-w-5xl">
            <h3 className="text-headline-sm font-headline-sm text-on-surface mb-6 font-bold">
              Informasi Kandang
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Fields */}
              <form onSubmit={handleInfoSubmit} noValidate className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nama Kandang */}
                  <Input
                    label="Nama Kandang"
                    value={infoForm.name}
                    onChange={handleInfoChange("name")}
                    error={infoErrors.name}
                    placeholder="Masukkan nama kandang"
                    required
                    disabled={isSavingInfo}
                  />

                  {/* Nama Zona select */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label
                      htmlFor="detail-zone"
                      className="font-plus-jakarta-sans text-[12px] font-bold tracking-wider uppercase text-on-surface-variant ml-1"
                    >
                      Zona <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="detail-zone"
                        value={infoForm.zone}
                        onChange={handleZoneSelectChange}
                        disabled={isSavingInfo}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl bg-white text-on-surface font-body-sm text-body-sm border transition-all cursor-pointer appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
                          infoErrors.zone
                            ? "border-error focus:border-error focus:ring-error"
                            : "border-outline-variant/60 hover:border-outline-variant"
                        )}
                      >
                        <option value="" disabled>
                          Pilih Zona
                        </option>
                        {zonesList.map((z) => (
                          <option key={z} value={z}>
                            {z}
                          </option>
                        ))}
                        <option value="Lainnya">Lainnya...</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none select-none">
                        expand_more
                      </span>
                    </div>
                    {infoErrors.zone && (
                      <span className="text-error text-xs ml-1 mt-0.5">{infoErrors.zone}</span>
                    )}

                    {/* Custom Zone Input */}
                    {infoForm.zone === "Lainnya" && (
                      <div className="mt-3">
                        <Input
                          label="Nama Zona Baru"
                          value={infoForm.customZone}
                          onChange={handleInfoChange("customZone")}
                          error={infoErrors.customZone}
                          placeholder="Masukkan nama zona baru"
                          required
                          disabled={isSavingInfo}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Deskripsi */}
                <Textarea
                  label="Deskripsi"
                  value={infoForm.description}
                  onChange={handleInfoChange("description")}
                  error={infoErrors.description}
                  placeholder="Tambahkan detail deskripsi kandang..."
                  rows={5}
                  disabled={isSavingInfo}
                />

                <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/15">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    isLoading={isSavingInfo} 
                    className="rounded-xl px-6 font-semibold shadow-sm active:scale-95 transition-all"
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              </form>

              {/* Kolom Kanan: Pratinjau Foto Utama */}
              <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-outline-variant/20 pt-6 lg:pt-0 lg:pl-8 flex flex-col gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingPhoto || isSavingInfo}
                />
                
                <div className="flex flex-col gap-2">
                  <span className="font-plus-jakarta-sans text-[12px] font-bold tracking-wider uppercase text-on-surface-variant ml-1">
                    Foto Utama Kandang
                  </span>
                  
                  {isUploadingPhoto ? (
                    <div className="border border-dashed border-primary/40 rounded-2xl p-6 text-center bg-primary/[0.02] flex flex-col items-center justify-center min-h-[200px] transition-all">
                      <Spinner className="h-8 w-8 text-primary mb-3" />
                      <p className="font-label-md text-on-surface font-bold">Mengunggah Foto...</p>
                      <p className="text-xs text-outline/85 mt-1">{uploadProgress}% selesai</p>
                      
                      <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-4 max-w-[160px] overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : mainPhotoUrl ? (
                    <div className="group relative bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm transition-all duration-200 hover:shadow-md">
                      <div className="aspect-video w-full bg-surface-container-highest overflow-hidden relative">
                        <img
                          src={mainPhotoUrl}
                          alt="Foto Utama Kandang"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setMainPhotoUrl(null)}
                          className="absolute top-2.5 right-2.5 bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl shadow-md transition-all active:scale-90 cursor-pointer"
                          title="Hapus Foto Utama"
                        >
                          <span className="material-symbols-outlined text-[16px] block select-none">delete</span>
                        </button>
                      </div>
                      <div className="p-3 bg-white flex items-center justify-between border-t border-outline-variant/15">
                        <span className="font-medium text-xs text-outline/80 truncate max-w-[120px]" title={mainPhotoUrl}>
                          File terunggah
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary hover:text-primary-dim font-label-sm text-xs font-bold cursor-pointer transition-colors"
                        >
                          Ganti Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-outline-variant/60 hover:border-outline rounded-2xl p-6 text-center bg-surface-container-low/10 flex flex-col items-center justify-center min-h-[200px] transition-all">
                      <span className="material-symbols-outlined text-4xl text-outline/60 mb-2 select-none">
                        image
                      </span>
                      <p className="font-label-sm text-[13px] text-on-surface font-semibold">
                        Belum ada foto utama
                      </p>
                      <p className="text-[11px] text-outline mt-1 max-w-[200px] leading-normal font-medium">
                        Unggah foto berformat JPG/PNG dengan ukuran maksimal 5MB.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 bg-primary hover:opacity-90 text-on-primary px-4 py-2 rounded-xl font-label-sm text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                      >
                        Pilih & Unggah Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Tab 2: Materi Edukasi --- */}
        {activeTab === "tab-edukasi" && (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm max-w-4xl space-y-4">
            <div className="mb-2">
              <h3 className="text-headline-sm font-headline-sm text-on-surface font-bold">
                Materi Edukasi Kandang
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Kelola materi deskripsi teks pembelajaran yang disesuaikan untuk masing-masing tingkatan umur pengunjung.
              </p>
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {(["CHILD", "TEEN", "ADULT"] as const).map((cat) => {
                const isOpened = openAccordion === cat;
                const hasContent = exhibit.learningContent.some((c) => c.ageCategory === cat);
                const categoryLabel = {
                  CHILD: "Anak-Anak (≤ 12 Tahun)",
                  TEEN: "Remaja (13 - 17 Tahun)",
                  ADULT: "Dewasa (18+ Tahun)",
                }[cat];
                const categoryEmoji = { CHILD: "🧒", TEEN: "🧑", ADULT: "👨" }[cat];

                return (
                  <div
                    key={cat}
                    className="border border-outline-variant/20 rounded-2xl overflow-hidden transition-all duration-200 bg-white"
                  >
                    {/* Accordion Header */}
                    <button
                      type="button"
                      onClick={() => setOpenAccordion(isOpened ? null : cat)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-container-low/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl select-none">{categoryEmoji}</span>
                        <span className="font-semibold text-body-md text-on-surface">
                          {categoryLabel}
                        </span>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider select-none",
                            hasContent
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          )}
                        >
                          {hasContent ? "Ada Konten" : "Belum Ada"}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "material-symbols-outlined text-outline transition-transform duration-200 select-none",
                          isOpened && "rotate-180"
                        )}
                      >
                        expand_more
                      </span>
                    </button>

                    {/* Accordion Body */}
                    {isOpened && (
                      <div className="p-5 bg-white border-t border-outline-variant/15">
                        <ContentEditor
                          ageCategory={cat}
                          existingContent={exhibit.learningContent.find((c) => c.ageCategory === cat)}
                          onSave={async (title, body) => {
                            const success = await handleSaveContent(cat, title, body);
                            return success;
                          }}
                          onDelete={async () => {
                            const success = await handleDeleteContent(cat);
                            return success;
                          }}
                          isSaving={isSavingContent}
                          isDeleting={isDeletingContent}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- Tab 3: Media --- */}
        {activeTab === "tab-media" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Media Uploader Component */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-6">
                <MediaUploader
                  exhibitId={exhibit.id}
                  onSuccess={() => {
                    refetch();
                  }}
                />
              </div>
            </div>

            {/* Right Column: Media Gallery List */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
                <h3 className="text-headline-sm font-headline-sm text-on-surface mb-6 font-bold flex items-center justify-between">
                  <span>Galeri Media Kandang</span>
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-primary/5 text-primary border border-primary/10 select-none">
                    Total: {exhibit.media.length} Media
                  </span>
                </h3>

                {exhibit.media.length === 0 ? (
                  <div className="text-center py-16 text-on-surface-variant flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/40 rounded-2xl bg-surface-container-low/10">
                    <span className="material-symbols-outlined text-5xl mb-3 text-outline-variant select-none">
                      photo_library
                    </span>
                    <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                      Belum ada media di kandang ini
                    </p>
                    <p className="font-body-sm text-body-sm text-outline mt-1 max-w-xs">
                      Silakan unggah media baru menggunakan formulir di sebelah kiri.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {exhibit.media.map((media) => {
                      const ageLabels = {
                        CHILD: "Anak-anak (≤12)",
                        TEEN: "Remaja (13-17)",
                        ADULT: "Dewasa (18+)",
                        ALL: "Semua Kalangan",
                      };

                      return (
                        <div
                          key={media.id}
                          className="group relative bg-white rounded-xl overflow-hidden border border-outline-variant/15 transition-all duration-200 hover:shadow-md"
                        >
                          {/* Media Preview Area */}
                          <div className="h-40 bg-surface-container-low flex items-center justify-center relative overflow-hidden border-b border-outline-variant/10">
                            {media.mediaType === "IMAGE_INFOGRAPHIC" && (
                              <img
                                src={media.fileUrl}
                                alt={media.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            )}

                            {media.mediaType === "VIDEO" && (
                              <div className="flex flex-col items-center justify-center text-center w-full h-full bg-slate-950/5">
                                <span className="material-symbols-outlined text-4xl text-outline group-hover:text-primary group-hover:scale-110 transition-all select-none">
                                  play_circle
                                </span>
                              </div>
                            )}

                            {media.mediaType === "AUDIO" && (
                              <div className="flex flex-col items-center justify-center text-center w-full h-full bg-slate-950/5">
                                <span className="material-symbols-outlined text-4xl text-outline group-hover:text-primary group-hover:scale-110 transition-all select-none">
                                  music_note
                                </span>
                              </div>
                            )}

                            {media.mediaType === "INTERACTIVE_LAB" && (
                              <div className="flex flex-col items-center justify-center text-center w-full h-full bg-slate-950/5">
                                <span className="material-symbols-outlined text-4xl text-outline group-hover:text-primary group-hover:scale-110 transition-all select-none">
                                  science
                                </span>
                              </div>
                            )}

                            {/* Media Type Chip */}
                            <span className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg text-white text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 select-none">
                              <span className="material-symbols-outlined text-[12px]">
                                {media.mediaType === "IMAGE_INFOGRAPHIC" && "image"}
                                {media.mediaType === "VIDEO" && "movie"}
                                {media.mediaType === "AUDIO" && "music_note"}
                                {media.mediaType === "INTERACTIVE_LAB" && "science"}
                              </span>
                              {media.mediaType === "IMAGE_INFOGRAPHIC" && "Infografis"}
                              {media.mediaType === "VIDEO" && "Video"}
                              {media.mediaType === "AUDIO" && "Audio"}
                              {media.mediaType === "INTERACTIVE_LAB" && "Lab"}
                            </span>

                            {/* Hover Delete Action Button */}
                            <button
                              type="button"
                              onClick={() => media.id && handleDeleteMedia(media.id)}
                              disabled={isDeletingMedia !== null}
                              className={`absolute top-2.5 right-2.5 bg-red-600 text-white p-2 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all active:scale-90 duration-200 ${
                                isDeletingMedia === media.id
                                  ? "cursor-wait"
                                  : "hover:bg-red-700 cursor-pointer"
                              }`}
                            >
                              {isDeletingMedia === media.id ? (
                                <Spinner className="h-4 w-4 block text-white" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px] block select-none">
                                  delete
                                </span>
                              )}
                            </button>
                          </div>

                          {/* Info Area */}
                          <div className="p-3.5 bg-white">
                            <h4 className="font-semibold text-body-sm text-on-surface truncate" title={media.title}>
                              {media.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider select-none",
                                  media.ageCategory === "CHILD" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                  media.ageCategory === "TEEN" && "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
                                  media.ageCategory === "ADULT" && "bg-purple-500/10 text-purple-600 border-purple-500/20",
                                  media.ageCategory === "ALL" && "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                )}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                                  {media.ageCategory === "CHILD" && "child_care"}
                                  {media.ageCategory === "TEEN" && "person"}
                                  {media.ageCategory === "ADULT" && "groups"}
                                  {media.ageCategory === "ALL" && "public"}
                                </span>
                                {ageLabels[media.ageCategory]}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Tab 4: QR Code --- */}
        {activeTab === "tab-qr" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl">
            {/* QR Card Container */}
            <div className="md:col-span-5 lg:col-span-4">
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-white border border-outline-variant/20 rounded-2xl mb-4 shadow-sm">
                  <QRCodeCanvas
                    id="exhibit-qrcode-canvas"
                    value={exhibit.qr_code_identifier}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="font-mono text-body-md text-on-surface bg-surface-container-low border border-outline-variant/20 px-3.5 py-1.5 rounded-xl uppercase tracking-wider font-bold mb-6">
                  {exhibit.qr_code_identifier}
                </p>

                <div className="flex flex-col gap-2.5 w-full">
                  <Button onClick={downloadQrCode} className="w-full flex items-center justify-center gap-2 rounded-xl">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Unduh QR Code
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => window.print()}
                    className="w-full border border-outline-variant hover:border-outline-variant/60 flex items-center justify-center gap-2 rounded-xl"
                  >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    Cetak
                  </Button>
                </div>
              </div>
            </div>

            {/* Instruction Warning Card */}
            <div className="md:col-span-7 lg:col-span-8">
              <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row gap-4">
                <span className="material-symbols-outlined text-amber-600 text-3xl shrink-0 select-none">
                  warning_amber
                </span>
                <div>
                  <h4 className="font-headline-sm text-headline-sm text-amber-955 font-bold mb-3">
                    Panduan & Instruksi Pemasangan QR Code
                  </h4>
                  <ul className="list-disc pl-5 space-y-2 text-body-sm text-body-sm text-amber-900/90 leading-relaxed">
                    <li>
                      <strong>Cetak Berkualitas:</strong> Cetak QR Code pada material tahan cuaca, seperti papan akrilik keras atau plat aluminium agar awet di area kandang outdoor.
                    </li>
                    <li>
                      <strong>Ketinggian Strategis:</strong> Pasang QR Code pada ketinggian 120cm - 150cm dari lantai kandang. Ketinggian ini dinilai ideal dan ramah untuk rata-rata mata anak-anak maupun orang dewasa.
                    </li>
                    <li>
                      <strong>Cahaya yang Tepat:</strong> Pastikan pencahayaan sekitar cukup terang namun hindari paparan sinar matahari langsung yang dapat menimbulkan kilau/pantulan cahaya kuat pada permukaan QR Code.
                    </li>
                    <li>
                      <strong>Uji Pindai:</strong> Lakukan uji coba pemindaian mandiri menggunakan smartphone dari berbagai jarak dan sudut sebelum kandang resmi dibuka untuk publik.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Tab 5: Statistik --- */}
        {activeTab === "tab-statistik" && (
          <div className="space-y-6">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Kunjungan */}
              <div className="group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider select-none">
                      Total Kunjungan
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1.5">
                      {exhibit.stats?.totalVisitors ?? "0"}
                    </h3>
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-all select-none"
                    style={{
                      backgroundColor: "rgba(0,93,66,0.08)",
                      color: "var(--color-primary)",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                      groups
                    </span>
                  </div>
                </div>
                {/* Glow */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-primary/5 filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Rata-rata Durasi */}
              <div className="group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider select-none">
                      Rata-rata Durasi
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1.5">
                      {exhibit.stats?.avgDurationMinutes ?? "0"}m
                    </h3>
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-all select-none"
                    style={{
                      backgroundColor: "rgba(105,95,0,0.08)",
                      color: "var(--color-secondary)",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                      schedule
                    </span>
                  </div>
                </div>
                {/* Glow */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-secondary/5 filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Media Favorit */}
              <div className="group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div className="max-w-[calc(100%-48px)]">
                    <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider block truncate select-none">
                      Media Terfavorit
                    </span>
                    <h3
                      className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1.5 truncate"
                      title={exhibit.stats?.favoriteMedia}
                    >
                      {exhibit.stats?.favoriteMedia ?? "-"}
                    </h3>
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-all select-none"
                    style={{
                      backgroundColor: "rgba(0,104,115,0.08)",
                      color: "var(--color-tertiary)",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                      star
                    </span>
                  </div>
                </div>
                {/* Glow */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-tertiary/5 filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Knowledge Gain */}
              <div className="group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider select-none">
                      Knowledge Gain
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1.5">
                      +{exhibit.stats?.knowledgeGainPercent ?? "0"}%
                    </h3>
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-all select-none"
                    style={{
                      backgroundColor: "rgba(2,132,199,0.08)",
                      color: "#0284c7",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                      trending_up
                    </span>
                  </div>
                </div>
                {/* Glow */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-sky-500/5 filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Dashboard Analytics Graph & Breakdown Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Chart Card (Left 2 Columns) */}
              <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm min-h-[380px] flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Tren Kunjungan & Interaksi
                  </h3>
                  <div className="flex gap-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-xs text-outline bg-primary/[0.06] text-primary px-3 py-1 rounded-full border border-primary/10 select-none">
                      <span
                        className="w-2 h-2 rounded-full inline-block animate-pulse"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      />
                      Pengunjung Unik
                    </span>
                    <span className="inline-flex items-center gap-2 font-semibold text-xs text-outline bg-secondary/[0.06] text-secondary px-3 py-1 rounded-full border border-secondary/10 select-none">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: "var(--color-secondary)" }}
                      />
                      Total Interaksi
                    </span>
                  </div>
                </div>

                {isLoadingTrend ? (
                  <div className="flex-1 flex items-center justify-center min-h-[280px]">
                    <Spinner className="h-10 w-10 text-outline" />
                  </div>
                ) : trendData.length === 0 ? (
                  <div className="flex-1 border border-dashed border-outline-variant/50 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-surface-container-low/20">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2 select-none">
                      monitoring
                    </span>
                    <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                      Belum Ada Data Tren
                    </p>
                    <p className="font-body-sm text-body-sm text-outline mt-1 max-w-sm">
                      Data interaksi tren akan terisi setelah pengunjung berinteraksi dengan kandang ini.
                    </p>
                  </div>
                ) : (
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={trendData}
                        margin={{ top: 5, right: 10, bottom: 5, left: -15 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e1e3e4"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6e7a73", fontSize: 11 }}
                          dy={10}
                        />
                        <YAxis
                          yAxisId="left"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6e7a73", fontSize: 11 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6e7a73", fontSize: 11 }}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar
                          yAxisId="left"
                          dataKey="visitors"
                          name="Pengunjung"
                          fill="var(--color-primary)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="interactions"
                          name="Interaksi"
                          stroke="var(--color-secondary)"
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Engagement Metrics Panel (Right 1 Column) */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-4">
                    Analisis Keterlibatan
                  </h3>
                  
                  {derivedStats ? (
                    <div className="space-y-4">
                      {/* Engagement Level Switch */}
                      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3.5">
                        <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                          Indeks Keterlibatan
                        </span>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold border select-none uppercase tracking-wider",
                          derivedStats.engagementColor
                        )}>
                          {derivedStats.engagementLevel}
                        </span>
                      </div>

                      {/* Average Interactions */}
                      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3.5">
                        <div>
                          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                            Rasio Interaksi
                          </span>
                          <span className="text-[10px] text-outline block mt-0.5">
                            Jumlah klik media per pengunjung
                          </span>
                        </div>
                        <span className="text-headline-sm font-bold text-on-surface">
                          {derivedStats.avgInteractionsPerVisitor}
                          <span className="text-body-sm font-medium text-outline ml-1">/ org</span>
                        </span>
                      </div>

                      {/* Peak Visitor Date */}
                      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3.5">
                        <div>
                          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                            Puncak Kunjungan
                          </span>
                          <span className="text-[10px] text-outline block mt-0.5">
                            Kunjungan tertinggi dalam satu hari
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-body-md text-on-surface block">
                            {derivedStats.maxVis} orang
                          </span>
                          <span className="text-xs text-outline font-semibold">
                            {derivedStats.maxVisDay || "-"}
                          </span>
                        </div>
                      </div>

                      {/* Peak Interaction Date */}
                      <div className="flex items-center justify-between pb-1">
                        <div>
                          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                            Puncak Aktivitas
                          </span>
                          <span className="text-[10px] text-outline block mt-0.5">
                            Interaksi terbanyak dalam satu hari
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-body-md text-on-surface block">
                            {derivedStats.maxInt} klik
                          </span>
                          <span className="text-xs text-outline font-semibold">
                            {derivedStats.maxIntDay || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-outline-variant">
                      <span className="material-symbols-outlined text-4xl mb-2 select-none">bar_chart</span>
                      <p className="font-body-sm text-body-sm font-medium">Data keterlibatan belum dihitung</p>
                    </div>
                  )}
                </div>

                {/* Footer description */}
                {derivedStats && (
                  <div className="mt-6 p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/15">
                    <p className="text-[11px] text-outline leading-relaxed font-medium">
                      Rasio interaksi {derivedStats.avgInteractionsPerVisitor}x menunjukkan minat rata-rata pengunjung dalam memindai info, mendengarkan audio, memutar video, atau bermain kuis lab di area kandang ini.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* --- Tab 6: Lab Interaktif --- */}
        {activeTab === "tab-lab" && (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm max-w-5xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-headline-sm font-headline-sm text-on-surface font-bold">
                  Lab Game Interaktif
                </h3>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Kelola permainan edukasi interaktif untuk pengunjung di area kandang ini.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedGame(null);
                  setIsFormModalOpen(true);
                }}
                className="bg-primary text-on-primary hover:opacity-90 px-5 py-2.5 rounded-xl font-label-md transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer font-semibold shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px] select-none">add</span>
                Tambah Game
              </button>
            </div>

            {isLoadingLab ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <Spinner className="h-10 w-10 text-primary" />
                <p className="text-body-md text-on-surface-variant font-medium">Memuat data game lab...</p>
              </div>
            ) : labGames.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant flex flex-col items-center justify-center border border-dashed border-outline-variant/40 rounded-2xl bg-surface-container-low/10">
                <span className="material-symbols-outlined text-5xl mb-3 text-outline-variant select-none">
                  science
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                  Belum ada game lab interaktif
                </p>
                <p className="font-body-sm text-body-sm text-outline mt-1 max-w-xs mb-6 font-medium">
                  Buat game drag-and-drop, pencocokan, atau pilihan gambar untuk kandang ini.
                </p>
                <button
                  onClick={() => {
                    setSelectedGame(null);
                    setIsFormModalOpen(true);
                  }}
                  className="border border-primary text-primary hover:bg-primary/5 px-4 py-2 rounded-xl font-label-sm text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  Buat Game Pertama
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-outline-variant/20 shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50 border-b border-outline-variant/20 font-label-sm text-label-sm text-on-surface-variant">
                        <th className="px-6 py-4 font-bold uppercase tracking-wider">Judul Game</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider">Tipe Game</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider">Kategori Usia</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider">Status Aktif</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm text-body-sm text-on-surface">
                      {labGames.map((game) => {
                        const gameTypeLabel = {
                          DRAG_DROP: "Drag & Drop",
                          MATCHING: "Pencocokan",
                          PICTURE_CHOICE: "Pilihan Gambar",
                        }[game.gameType] || game.gameType;

                        const ageLabels = {
                          CHILD: "Anak-anak (≤12)",
                          TEEN: "Remaja (13-17)",
                          ADULT: "Dewasa (18+)",
                          ALL: "Semua Kalangan",
                        }[game.ageCategory] || game.ageCategory;

                        return (
                          <tr
                            key={game.id}
                            className="border-b border-outline-variant/15 hover:bg-surface-container-low/30 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold max-w-[250px] truncate" title={game.title}>
                              {game.title}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider select-none",
                                  game.gameType === "DRAG_DROP" && "bg-sky-500/10 text-sky-600 border-sky-500/20",
                                  game.gameType === "MATCHING" && "bg-violet-500/10 text-violet-600 border-violet-500/20",
                                  game.gameType === "PICTURE_CHOICE" && "bg-pink-500/10 text-pink-600 border-pink-500/20"
                                )}
                              >
                                {gameTypeLabel}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider select-none",
                                  game.ageCategory === "CHILD" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                  game.ageCategory === "TEEN" && "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
                                  game.ageCategory === "ADULT" && "bg-purple-500/10 text-purple-600 border-purple-500/20",
                                  game.ageCategory === "ALL" && "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                )}
                              >
                                {ageLabels}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleActive(game.id, game.isActive)}
                                className={cn(
                                  "w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
                                  game.isActive ? "bg-primary" : "bg-outline-variant/60"
                                )}
                              >
                                <div
                                  className={cn(
                                    "bg-white w-4.5 h-4.5 rounded-full shadow transition-transform duration-200",
                                    game.isActive ? "translate-x-4.5" : "translate-x-0"
                                  )}
                                />
                              </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedGame(game);
                                    setIsFormModalOpen(true);
                                  }}
                                  className="rounded-xl p-2 text-outline hover:text-primary hover:bg-primary/10 transition-all active:scale-95 cursor-pointer"
                                  title="Edit Game"
                                >
                                  <span className="material-symbols-outlined text-[18px] block select-none">
                                    edit
                                  </span>
                                </button>
                                <button
                                  onClick={() => duplicateGame(game)}
                                  disabled={isDuplicating === game.id}
                                  className={cn(
                                    "rounded-xl p-2 transition-all active:scale-95 cursor-pointer",
                                    isDuplicating === game.id
                                      ? "text-outline-variant cursor-wait"
                                      : "text-outline hover:text-secondary hover:bg-secondary/10"
                                  )}
                                  title="Duplikat Game"
                                >
                                  {isDuplicating === game.id ? (
                                    <Spinner className="h-4.5 w-4.5 block" />
                                  ) : (
                                    <span className="material-symbols-outlined text-[18px] block select-none">
                                      content_copy
                                    </span>
                                  )}
                                </button>
                                <button
                                  onClick={() => setGameToDelete(game.id)}
                                  disabled={isDeletingLab === game.id}
                                  className={cn(
                                    "rounded-xl p-2 transition-all active:scale-95 cursor-pointer",
                                    isDeletingLab === game.id
                                      ? "text-outline-variant cursor-wait"
                                      : "text-outline hover:text-error hover:bg-error/10"
                                  )}
                                  title="Hapus Game"
                                >
                                  {isDeletingLab === game.id ? (
                                    <Spinner className="h-4.5 w-4.5 block" />
                                  ) : (
                                    <span className="material-symbols-outlined text-[18px] block select-none">
                                      delete
                                    </span>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Modals for Lab Games --- */}
      <ConfirmModal
        isOpen={gameToDelete !== null}
        onClose={() => setGameToDelete(null)}
        onConfirm={async () => {
          if (gameToDelete !== null) {
            await deleteGame(gameToDelete);
            setGameToDelete(null);
          }
        }}
        title="Hapus Game Lab"
        description="Apakah Anda yakin ingin menghapus game lab ini? Tindakan ini tidak dapat dibatalkan dan game akan dihapus secara permanen dari database."
        confirmLabel="Hapus Permanen"
        cancelLabel="Batal"
        variant="danger"
        isLoading={isDeletingLab !== null}
      />

      <LabGameFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedGame(null);
        }}
        game={selectedGame}
        exhibitId={id}
        onCreate={createGame}
        onUpdate={updateGame}
      />
    </div>
  );
}
