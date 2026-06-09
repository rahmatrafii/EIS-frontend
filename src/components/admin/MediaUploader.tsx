// src/components/admin/MediaUploader.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { validateMediaFile, uploadToCloudinary, formatFileSize } from "@/services/cloudinary.service";
import { saveExhibitMedia } from "@/services/admin.service";
import { FILE_ACCEPT_MAP, MAX_FILE_SIZE } from "@/constants/cloudinary";

// ─── Types ───────────────────────────────────────────────────────

type MediaType = "AUDIO" | "VIDEO" | "IMAGE_INFOGRAPHIC" | "INTERACTIVE_LAB";
type AgeCategory = "CHILD" | "TEEN" | "ADULT" | "ALL";
type UploadState = "idle" | "uploading" | "success" | "error";

interface MediaUploaderProps {
  exhibitId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────

const MEDIA_TYPE_OPTIONS: { value: MediaType; label: string; icon: string }[] = [
  { value: "AUDIO", label: "Audio", icon: "music_note" },
  { value: "VIDEO", label: "Video", icon: "videocam" },
  { value: "IMAGE_INFOGRAPHIC", label: "Infografis", icon: "image" },
];

const AGE_CATEGORY_OPTIONS: { value: AgeCategory; label: string }[] = [
  { value: "ALL", label: "Semua Kalangan" },
  { value: "CHILD", label: "Anak (≤12)" },
  { value: "TEEN", label: "Remaja (13–17)" },
  { value: "ADULT", label: "Dewasa (18+)" },
];

// ─── Component ───────────────────────────────────────────────────

export default function MediaUploader({ exhibitId, onSuccess, onCancel }: MediaUploaderProps) {
  // Form state
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("IMAGE_INFOGRAPHIC");
  const [ageCategory, setAgeCategory] = useState<AgeCategory>("ALL");

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── File Selection ──────────────────────────────────────────

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validasi file
      const validation = validateMediaFile(file, mediaType);
      if (!validation.valid) {
        setErrorMessage(validation.error ?? "File tidak valid.");
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setErrorMessage(null);
    },
    [mediaType]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Reset selected file when mediaType changes (karena accept filter berubah)
  const handleMediaTypeChange = (newType: MediaType) => {
    setMediaType(newType);
    clearFile();
  };

  // ─── Upload Flow ─────────────────────────────────────────────

  const handleSubmit = async () => {
    // 1. Validasi form
    if (!title.trim()) {
      setErrorMessage("Judul media wajib diisi.");
      return;
    }
    if (!selectedFile) {
      setErrorMessage("Pilih file yang akan diupload.");
      return;
    }

    // 2. Re-validasi file (untuk jaga-jaga)
    const validation = validateMediaFile(selectedFile, mediaType);
    if (!validation.valid) {
      setErrorMessage(validation.error ?? "File tidak valid.");
      return;
    }

    setErrorMessage(null);
    setUploadState("uploading");
    setUploadProgress(0);

    try {
      // 3. Upload ke Cloudinary
      const fileUrl = await uploadToCloudinary(
        selectedFile,
        mediaType,
        (percent) => setUploadProgress(percent)
      );

      // 4. Kirim URL ke backend melalui service
      const result = await saveExhibitMedia({
        exhibitId,
        ageCategory,
        mediaType,
        title: title.trim(),
        fileUrl,
      });

      if (!result.success) {
        throw new Error(result.error?.message ?? "Gagal menyimpan data media ke server.");
      }

      // 5. Sukses
      setUploadState("success");
      onSuccess?.();
    } catch (err) {
      setUploadState("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengupload. Silakan coba lagi."
      );
    }
  };

  const isUploading = uploadState === "uploading";
  const isSuccess = uploadState === "success";
  const maxMB = Math.round((MAX_FILE_SIZE[mediaType] ?? 50 * 1024 * 1024) / (1024 * 1024));

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div
      className="rounded-[24px] overflow-hidden"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid rgba(189,201,193,0.3)",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-5 flex items-center gap-3"
        style={{
          borderBottom: "1px solid var(--color-outline-variant)",
          backgroundColor: "var(--color-surface-container-low)",
        }}
      >
        <span
          className="material-symbols-outlined fill-icon"
          style={{ fontSize: "24px", color: "var(--color-primary)" }}
        >
          cloud_upload
        </span>
        <h3
          className="font-headline-sm text-headline-sm"
          style={{ color: "var(--color-on-surface)" }}
        >
          Tambah Media
        </h3>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Success State */}
        {isSuccess && (
          <div
            className="rounded-[16px] p-5 flex items-center gap-4"
            style={{
              backgroundColor: "var(--color-secondary-container)",
              border: "1px solid rgba(0,114,48,0.2)",
            }}
          >
            <span
              className="material-symbols-outlined fill-icon"
              style={{ fontSize: "32px", color: "#005320" }}
            >
              check_circle
            </span>
            <div>
              <p className="font-label-md text-label-md" style={{ color: "#005320" }}>
                Media berhasil diupload dan disimpan!
              </p>
              <p className="font-body-sm text-body-sm mt-1" style={{ color: "#005320" }}>
                File telah tersimpan di Cloudinary dan terhubung ke kandang.
              </p>
            </div>
          </div>
        )}

        {/* Form Fields */}
        {!isSuccess && (
          <>
            {/* Judul Media */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="media-title"
                className="font-label-md text-label-md"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Judul Media
              </label>
              <input
                id="media-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                placeholder="Contoh: Auman Harimau Sumatera"
                className="font-body-md text-body-md px-4 py-3 rounded-[12px] outline-none transition-all duration-200"
                style={{
                  backgroundColor: "var(--color-surface-container)",
                  border: "1px solid var(--color-outline-variant)",
                  color: "var(--color-on-surface)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--color-primary)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--color-outline-variant)")
                }
              />
            </div>

            {/* Media Type & Age Category Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Jenis Media */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="media-type"
                  className="font-label-md text-label-md"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Jenis Media
                </label>
                <div className="relative">
                  <select
                    id="media-type"
                    value={mediaType}
                    onChange={(e) => handleMediaTypeChange(e.target.value as MediaType)}
                    disabled={isUploading}
                    className="w-full font-body-md text-body-md px-4 py-3 rounded-[12px] outline-none appearance-none cursor-pointer transition-all duration-200"
                    style={{
                      backgroundColor: "var(--color-surface-container)",
                      border: "1px solid var(--color-outline-variant)",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    {MEDIA_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span
                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ fontSize: "20px", color: "var(--color-outline)" }}
                  >
                    expand_more
                  </span>
                </div>
              </div>

              {/* Kategori Usia */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="age-category"
                  className="font-label-md text-label-md"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Kategori Usia
                </label>
                <div className="relative">
                  <select
                    id="age-category"
                    value={ageCategory}
                    onChange={(e) => setAgeCategory(e.target.value as AgeCategory)}
                    disabled={isUploading}
                    className="w-full font-body-md text-body-md px-4 py-3 rounded-[12px] outline-none appearance-none cursor-pointer transition-all duration-200"
                    style={{
                      backgroundColor: "var(--color-surface-container)",
                      border: "1px solid var(--color-outline-variant)",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    {AGE_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span
                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ fontSize: "20px", color: "var(--color-outline)" }}
                  >
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                File Media
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className="relative rounded-[16px] p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: isDragOver
                    ? "rgba(0, 101, 44, 0.06)"
                    : "var(--color-surface-container-low)",
                  border: `2px dashed ${
                    isDragOver
                      ? "var(--color-primary)"
                      : selectedFile
                        ? "var(--color-secondary)"
                        : "var(--color-outline-variant)"
                  }`,
                  minHeight: "160px",
                  opacity: isUploading ? 0.6 : 1,
                  pointerEvents: isUploading ? "none" : "auto",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILE_ACCEPT_MAP[mediaType] ?? "*/*"}
                  onChange={handleInputChange}
                  className="hidden"
                />

                {selectedFile ? (
                  /* File Preview */
                  <div className="flex items-center gap-4 w-full">
                    <div
                      className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--color-primary-container)" }}
                    >
                      <span
                        className="material-symbols-outlined fill-icon"
                        style={{ fontSize: "24px", color: "var(--color-on-primary-container)" }}
                      >
                        {MEDIA_TYPE_OPTIONS.find((m) => m.value === mediaType)?.icon ?? "draft"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-body-md text-body-md truncate"
                        style={{ color: "var(--color-on-surface)" }}
                      >
                        {selectedFile.name}
                      </p>
                      <p
                        className="font-body-sm text-body-sm"
                        style={{ color: "var(--color-outline)" }}
                      >
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    {!isUploading && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-[var(--color-surface-container-high)]"
                        style={{ color: "var(--color-outline)" }}
                        title="Hapus file"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                          close
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Empty State */
                  <>
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: isDragOver
                          ? "var(--color-primary-container)"
                          : "var(--color-surface-container)",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "28px",
                          color: isDragOver
                            ? "var(--color-primary)"
                            : "var(--color-outline)",
                        }}
                      >
                        upload_file
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="font-body-md text-body-md" style={{ color: "var(--color-on-surface)" }}>
                        <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                          Klik untuk memilih file
                        </span>{" "}
                        atau drag & drop di sini
                      </p>
                      <p className="font-body-sm text-body-sm mt-1" style={{ color: "var(--color-outline)" }}>
                        Maks. {maxMB} MB •{" "}
                        {MEDIA_TYPE_OPTIONS.find((m) => m.value === mediaType)?.label ?? mediaType}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span
                    className="font-label-sm text-label-sm"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    {uploadProgress < 100 ? "Mengupload ke Cloudinary..." : "Menyimpan ke server..."}
                  </span>
                  <span
                    className="font-label-sm text-label-sm"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {uploadProgress}%
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--color-surface-container-high)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${uploadProgress}%`,
                      backgroundColor: "var(--color-primary)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div
                className="rounded-[12px] px-4 py-3 flex items-start gap-3"
                style={{
                  backgroundColor: "var(--color-error-container)",
                  border: "1px solid rgba(147,0,10,0.15)",
                }}
              >
                <span
                  className="material-symbols-outlined fill-icon shrink-0 mt-0.5"
                  style={{ fontSize: "18px", color: "#93000a" }}
                >
                  error
                </span>
                <p className="font-body-sm text-body-sm" style={{ color: "#93000a" }}>
                  {errorMessage}
                </p>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div
          className="flex justify-end gap-3 pt-3"
          style={{ borderTop: "1px solid var(--color-outline-variant)" }}
        >
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-full font-label-md text-label-md transition-all duration-200 hover:bg-[var(--color-surface-container-high)]"
            style={{
              color: "var(--color-on-surface-variant)",
              border: "1px solid var(--color-outline-variant)",
              opacity: isUploading ? 0.5 : 1,
            }}
          >
            {isSuccess ? "Tutup" : "Batal"}
          </button>

          {!isSuccess && (
            <button
              onClick={handleSubmit}
              disabled={isUploading || !title.trim() || !selectedFile}
              className="px-6 py-2.5 rounded-full font-label-md text-label-md flex items-center gap-2 transition-all duration-200"
              style={{
                backgroundColor:
                  isUploading || !title.trim() || !selectedFile
                    ? "var(--color-surface-container-high)"
                    : "var(--color-primary)",
                color:
                  isUploading || !title.trim() || !selectedFile
                    ? "var(--color-outline)"
                    : "var(--color-on-primary)",
                cursor:
                  isUploading || !title.trim() || !selectedFile
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {isUploading ? (
                <>
                  <span
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: "var(--color-outline)",
                      borderTopColor: "transparent",
                    }}
                  />
                  Mengupload...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    cloud_upload
                  </span>
                  Simpan Media
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
