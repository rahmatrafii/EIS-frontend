// src/app/(admin)/admin/exhibits/new/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/stores/ToastContext";
import { createExhibit, getAdminExhibits } from "@/services/admin.service";
import { validateExhibitForm } from "@/lib/validators";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import { validateMediaFile, uploadToCloudinary } from "@/services/cloudinary.service";
import { Spinner } from "@/components/ui/Spinner";

export default function AddNewExhibitPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Form State ---
  const [form, setForm] = useState({
    name: "",
    zone: "",
    customZone: "",
    description: "",
    imageUrl: "",
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdExhibit, setCreatedExhibit] = useState<{
    id: number;
    name: string;
    qr_code_identifier: string;
  } | null>(null);

  // --- Zones Dropdown List State ---
  const [zonesList, setZonesList] = useState<string[]>([
    "Zona Mamalia",
    "Zona Primata",
    "Zona Reptil",
    "Zona Unggas",
    "Zona Akuatik",
    "Zona Amfibi",
  ]);

  // Fetch existing zones on mount to dynamic populate the list
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

  // --- Handlers ---
  function handleChange(field: keyof typeof form) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };
  }

  function handleZoneChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      zone: val,
      customZone: val !== "Lainnya" ? "" : prev.customZone,
    }));

    if (errors.zone) {
      setErrors((prev) => ({ ...prev, zone: "" }));
    }
    if (errors.customZone) {
      setErrors((prev) => ({ ...prev, customZone: "" }));
    }
  }

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
      setForm((prev) => ({ ...prev, imageUrl: secureUrl }));
      toast.success("Foto utama berhasil diunggah!");
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

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validateExhibitForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const finalZone = form.zone === "Lainnya" ? form.customZone.trim() : form.zone;

    const result = await createExhibit({
      name: form.name.trim(),
      zone_name: finalZone,
      description: form.description.trim(),
      image_url: form.imageUrl || null,
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    toast.success("Kandang berhasil dibuat!");
    setCreatedExhibit({
      id: result.data.id,
      name: result.data.name,
      qr_code_identifier: result.data.qr_code_identifier,
    });
    setIsSuccess(true);
  }

  const downloadQrCode = () => {
    const canvas = document.getElementById(
      "exhibit-qrcode-canvas"
    ) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode-${(createdExhibit?.name || "kandang").toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const previewZoneText =
    form.zone === "Lainnya"
      ? form.customZone.trim()
        ? form.customZone.toUpperCase()
        : "ZONA KUSTOM"
      : form.zone
      ? form.zone.toUpperCase()
      : "ZONA BELUM DIPILIH";

  return (
    <div className="space-y-6">
      {/* ────────────── CSS Animasi Lokal ────────────── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes scaleIn {
            0% { transform: scale(0); opacity: 0; }
            80% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-scale-in {
            animation: scaleIn 0.5s ease-out forwards;
          }
        `,
        }}
      />

      {/* ────────────── Breadcrumb ────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="flex font-label-sm text-label-sm"
        style={{ color: "var(--color-on-surface-variant)" }}
      >
        <ol className="inline-flex items-center gap-2">
          <li className="inline-flex items-center">
            <button
              onClick={() => router.push(ROUTES.admin.dashboard)}
              className="hover:text-primary transition-colors cursor-pointer font-semibold"
            >
              ZooLogix Admin
            </button>
          </li>
          <li>
            <span
              className="material-symbols-outlined text-outline/50 select-none"
              style={{ fontSize: "14px" }}
            >
              chevron_right
            </span>
          </li>
          <li className="inline-flex items-center">
            <button
              onClick={() => router.push(ROUTES.admin.exhibits)}
              className="hover:text-primary transition-colors cursor-pointer font-semibold"
            >
              Kandang
            </button>
          </li>
          <li>
            <span
              className="material-symbols-outlined text-outline/50 select-none"
              style={{ fontSize: "14px" }}
            >
              chevron_right
            </span>
          </li>
          <li aria-current="page">
            <span className="font-bold" style={{ color: "var(--color-primary)" }}>
              Tambah Kandang Baru
            </span>
          </li>
        </ol>
      </nav>

      {/* ────────────── State Machine Container ────────────── */}
      <div className="relative min-h-[600px]">
        {/* PHASE 1: Form & Preview State */}
        {!isSuccess && (
          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-12 gap-6 transition-opacity duration-300",
              isSubmitting && "opacity-50 pointer-events-none"
            )}
          >
            {/* Left Column: Form */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
              <div
                className="rounded-3xl p-6 bg-surface-container-lowest"
                style={{
                  border: "1px solid rgba(189,201,193,0.3)",
                  boxShadow: "0px 4px 20px rgba(0,0,0,0.02)",
                }}
              >
                <h2 className="text-headline-lg font-headline-lg font-bold text-on-surface mb-6">
                  Tambah Kandang Baru
                </h2>
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {/* Nama Kandang */}
                  <div className="space-y-1">
                    <Input
                      label="Nama Kandang"
                      value={form.name}
                      onChange={handleChange("name")}
                      error={errors.name}
                      placeholder="Contoh: Savana Afrika"
                      maxLength={100}
                      required
                    />
                    <div className="flex justify-end pr-1">
                      <span className="text-[10px] font-medium tracking-wider uppercase text-on-surface-variant/50">
                        {form.name.length}/100
                      </span>
                    </div>
                  </div>

                  {/* Nama Zona */}
                  <div className="flex flex-col gap-1 w-full">
                    <label
                      htmlFor="exhibit-zone"
                      className="block text-label-md font-label-md text-on-surface-variant mb-2 ml-1"
                    >
                      Nama Zona <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="exhibit-zone"
                        value={form.zone}
                        onChange={handleZoneChange}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border bg-white text-on-surface transition-all cursor-pointer appearance-none",
                          "focus:outline-none border-outline-variant/60 hover:border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10",
                          errors.zone
                            ? "border-error focus:border-error focus:ring-error"
                            : "border-outline-variant/60"
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
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none select-none">
                        expand_more
                      </span>
                    </div>
                    {errors.zone && (
                      <span className="text-error text-xs ml-1 mt-1 fade-in-up">
                        {errors.zone}
                      </span>
                    )}

                    {/* Custom Zone Input (Shown only when 'Lainnya' is selected) */}
                    {form.zone === "Lainnya" && (
                      <div className="mt-3 fade-in-up">
                        <Input
                          label="Nama Zona Baru"
                          value={form.customZone}
                          onChange={handleChange("customZone")}
                          error={errors.customZone}
                          placeholder="Masukkan nama zona baru"
                          maxLength={50}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Deskripsi */}
                  <div className="space-y-1">
                    <Textarea
                      label="Deskripsi (Opsional)"
                      value={form.description}
                      onChange={handleChange("description")}
                      error={errors.description}
                      placeholder="Tambahkan detail tentang kandang ini..."
                      rows={4}
                      maxLength={500}
                    />
                    <div className="flex justify-end pr-1">
                      <span className="text-[10px] font-medium tracking-wider uppercase text-on-surface-variant/50">
                        {form.description.length}/500
                      </span>
                    </div>
                  </div>

                  {/* Foto Utama */}
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingPhoto || isSubmitting}
                    />
                    
                    <div className="flex flex-col gap-2">
                      <span className="block text-label-md font-label-md text-on-surface-variant ml-1">
                        Foto Utama Kandang
                      </span>
                      
                      {isUploadingPhoto ? (
                        <div className="border border-primary/20 rounded-2xl p-6 text-center bg-primary/[0.02] flex flex-col items-center justify-center min-h-[160px]">
                          <Spinner className="h-10 w-10 text-primary mb-3" />
                          <p className="font-label-md text-on-surface font-semibold">Mengunggah Foto...</p>
                          <p className="text-xs text-outline mt-1">{uploadProgress}% selesai</p>
                          
                          <div className="w-full bg-surface-container-high rounded-full h-2 mt-4 max-w-[180px]">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-150"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : form.imageUrl ? (
                        <div className="group relative bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm transition-all duration-200 hover:shadow-md max-w-md">
                          <div className="aspect-video w-full bg-surface-container-highest overflow-hidden relative">
                            <img
                              src={form.imageUrl}
                              alt="Foto Utama Kandang"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                              title="Hapus Foto Utama"
                            >
                              <span className="material-symbols-outlined text-[18px] block select-none">delete</span>
                            </button>
                          </div>
                          <div className="p-4 bg-surface-container-lowest flex items-center justify-between border-t border-outline-variant/15">
                            <span className="font-medium text-body-sm text-on-surface-variant text-xs truncate max-w-[200px]" title={form.imageUrl}>
                              File terunggah
                            </span>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-primary hover:underline font-semibold text-xs cursor-pointer"
                            >
                              Ganti Foto
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-outline-variant/60 rounded-2xl p-6 text-center bg-surface-container-lowest flex flex-col items-center justify-center min-h-[160px] hover:border-primary/50 transition-all">
                          <span className="material-symbols-outlined text-4xl text-outline mb-2 select-none">
                            image
                          </span>
                          <p className="font-body-sm text-body-sm text-on-surface-variant font-semibold">
                            Belum ada foto utama
                          </p>
                          <p className="text-xs text-outline mt-1 max-w-[260px] leading-normal">
                            Unggah foto berformat JPG/PNG dengan ukuran maksimal 5MB.
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 bg-primary hover:opacity-95 text-on-primary px-4 py-2 rounded-xl font-semibold text-xs cursor-pointer transition-all active:scale-95 shadow-sm"
                          >
                            Pilih & Unggah Foto
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4">
                    <Button type="submit" variant="primary" className="px-6 h-11 rounded-xl cursor-pointer shadow-sm">
                      Buat Kandang
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push(ROUTES.admin.exhibits)}
                      className="px-6 h-11 rounded-xl border border-outline-variant/60 hover:border-outline-variant/80 cursor-pointer"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Real-time Preview */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-24">
                <h3 className="font-label-sm text-label-sm font-semibold tracking-wider uppercase mb-3 text-on-surface-variant px-1">
                  Pratinjau
                </h3>
                <div 
                  className="group relative overflow-hidden rounded-3xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center min-h-[400px] bg-surface-container-lowest"
                  style={{
                    border: "1px solid rgba(189,201,193,0.35)",
                  }}
                >
                  <div
                    className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.1]"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                  {form.imageUrl ? (
                    <div className="w-full aspect-video bg-surface-container border border-outline-variant/30 rounded-2xl mb-6 overflow-hidden relative shadow-sm">
                      <img
                        src={form.imageUrl}
                        alt="Pratinjau Foto Kandang"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-[160px] aspect-square bg-surface-container/40 border border-outline-variant/30 rounded-2xl mb-6 flex items-center justify-center text-on-surface-variant p-4">
                      {/* QR Placeholder SVG */}
                      <svg
                        className="w-full h-full opacity-15"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2z"></path>
                      </svg>
                    </div>
                  )}
                  <div className="space-y-2 w-full relative z-10">
                    <p className="text-label-sm font-label-sm text-primary uppercase tracking-widest font-bold">
                      {previewZoneText}
                    </p>
                    <h4 className="text-headline-md font-headline-md font-bold text-on-surface break-words">
                      {form.name || "Nama Kandang Baru"}
                    </h4>
                    <p className="text-body-sm font-body-sm text-outline/80 line-clamp-3 mt-2">
                      {form.description ||
                        "Deskripsi akan muncul di sini saat Anda mulai mengetik..."}
                    </p>
                  </div>
                  <div className="mt-auto w-full pt-4 border-t border-outline-variant/20 mt-6 relative z-10">
                    <div className="flex items-center justify-center gap-1.5 text-on-surface-variant/80">
                      <span
                        className="material-symbols-outlined text-[18px] select-none"
                      >
                        qr_code_scanner
                      </span>
                      <span className="text-label-sm font-label-sm font-medium">
                        Siap untuk dipindai
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: Loading State Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-3xl">
            <Spinner className="h-16 w-16 text-primary mb-4" />
            <p className="text-headline-sm font-headline-sm font-bold text-on-surface">
              Memproses data kandang...
            </p>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
              Mohon tunggu sebentar.
            </p>
          </div>
        )}

        {/* PHASE 3: Success State */}
        {isSuccess && createdExhibit && (
          <div className="flex flex-col items-center justify-center py-12 transition-all duration-500 animate-fade-in-up">
            <div 
              className="rounded-3xl p-8 max-w-lg w-full text-center flex flex-col items-center bg-surface-container-lowest"
              style={{
                border: "1px solid rgba(189,201,193,0.35)",
                boxShadow: "0px 10px 40px rgba(0,0,0,0.04)",
              }}
            >
              <div className="w-16 h-16 bg-primary/[0.08] rounded-full flex items-center justify-center text-primary mb-6 shadow-sm animate-scale-in">
                <span
                  className="material-symbols-outlined select-none"
                  style={{ fontSize: "32px", fontWeight: "bold" }}
                >
                  check_circle
                </span>
              </div>
              <h2 className="text-headline-lg font-headline-lg font-bold text-on-surface mb-2">
                Kandang Berhasil Dibuat!
              </h2>
              <p className="text-body-sm text-outline/80 mb-6">
                Kandang baru telah tersimpan di sistem. Berikut adalah QR Code untuk signage fisik.
              </p>

              {/* Generated QR Card */}
              <div 
                className="rounded-2xl p-6 mb-6 shadow-sm inline-block bg-surface-container-lowest"
                style={{
                  border: "1px solid rgba(189,201,193,0.3)",
                }}
              >
                <div className="p-3 bg-white border border-outline-variant/30 rounded-xl mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                  <QRCodeCanvas
                    id="exhibit-qrcode-canvas"
                    value={createdExhibit.qr_code_identifier}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-label-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider">
                  ID: {createdExhibit.qr_code_identifier}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <Button
                  onClick={downloadQrCode}
                  className="flex items-center justify-center gap-1.5 px-6 h-11 rounded-xl cursor-pointer shadow-sm"
                >
                  <span
                    className="material-symbols-outlined select-none"
                    style={{ fontSize: "18px" }}
                  >
                    download
                  </span>
                  Unduh QR Code
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(`/admin/exhibits/${createdExhibit.id}`)
                  }
                  className="px-6 h-11 rounded-xl cursor-pointer"
                >
                  Isi Konten Sekarang
                </Button>
              </div>

              <button
                onClick={() => router.push(ROUTES.admin.exhibits)}
                className="mt-6 text-primary font-semibold text-label-md hover:underline decoration-2 underline-offset-4 cursor-pointer"
              >
                Kembali ke Daftar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
