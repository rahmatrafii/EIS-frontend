// src/components/admin/LabGameFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import { uploadToCloudinary } from "@/services/cloudinary.service";
import type {
  AdminLabGame,
  DragDropConfig,
  MatchingConfig,
  PictureChoiceConfig,
} from "@/types/admin.types";
import type { AgeCategory } from "@/types/exhibit.types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

interface LabGameFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: AdminLabGame | null;
  exhibitId: number;
  onCreate: (payload: {
    ageCategory: AgeCategory;
    gameType: "DRAG_DROP" | "MATCHING" | "PICTURE_CHOICE";
    title: string;
    gameConfig: any;
  }) => Promise<boolean>;
  onUpdate: (
    gameId: number,
    payload: {
      ageCategory?: AgeCategory;
      gameType?: "DRAG_DROP" | "MATCHING" | "PICTURE_CHOICE";
      title?: string;
      gameConfig?: any;
    }
  ) => Promise<boolean>;
}

// ─── ImageFieldUploader Sub-Component ─────────────────────────────
interface ImageFieldUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
}

function ImageFieldUploader({ value, onChange, label }: ImageFieldUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadToCloudinary(file, "IMAGE_INFOGRAPHIC", (p) => setProgress(p));
      onChange(url);
    } catch (err: any) {
      alert(err?.message || "Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-xs font-semibold text-on-surface-variant ml-1">{label}</span>
      {value ? (
        <div className="relative group w-32 h-32 rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm shrink-0">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      ) : (
        <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-outline-variant/50 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-container-low/30 hover:bg-primary/5 shrink-0">
          {uploading ? (
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] text-primary font-bold">{progress}%</span>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined text-outline-variant text-[24px]">add_photo_alternate</span>
              <span className="text-[10px] text-on-surface-variant font-medium mt-1">Pilih Gambar</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────
export default function LabGameFormModal({
  isOpen,
  onClose,
  game,
  exhibitId,
  onCreate,
  onUpdate,
}: LabGameFormModalProps) {
  // General Fields
  const [title, setTitle] = useState("");
  const [ageCategory, setAgeCategory] = useState<AgeCategory>("ALL");
  const [gameType, setGameType] = useState<"DRAG_DROP" | "MATCHING" | "PICTURE_CHOICE">("DRAG_DROP");

  // Config States
  const [dragDropConfig, setDragDropConfig] = useState<DragDropConfig>({
    target: { label: "", imageUrl: "" },
    items: [],
  });

  const [matchingConfig, setMatchingConfig] = useState<MatchingConfig>({
    pairs: [],
  });

  const [pictureChoiceConfig, setPictureChoiceConfig] = useState<PictureChoiceConfig>({
    question: "",
    options: [],
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync / Reset on Open
  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      if (game) {
        setTitle(game.title);
        setAgeCategory(game.ageCategory);
        setGameType(game.gameType);
        if (game.gameType === "DRAG_DROP") {
          const config = game.gameConfig as any;
          setDragDropConfig({
            target: {
              label: config?.target?.label || "",
              imageUrl: config?.target?.imageUrl || "",
            },
            items: config?.items || [],
          });
        } else if (game.gameType === "MATCHING") {
          setMatchingConfig(game.gameConfig as MatchingConfig);
        } else if (game.gameType === "PICTURE_CHOICE") {
          setPictureChoiceConfig(game.gameConfig as PictureChoiceConfig);
        }
      } else {
        setTitle("");
        setAgeCategory("ALL");
        setGameType("DRAG_DROP");
        setDragDropConfig({
          target: { label: "", imageUrl: "" },
          items: [],
        });
        setMatchingConfig({
          pairs: [{ id: `matching-${Date.now()}-1`, threat: "", solution: "" }],
        });
        setPictureChoiceConfig({
          question: "",
          options: [
            { id: `pc-${Date.now()}-1`, label: "", imageUrl: "", isCorrect: false },
            { id: `pc-${Date.now()}-2`, label: "", imageUrl: "", isCorrect: false },
          ],
        });
      }
    }
  }, [game, isOpen]);

  if (!isOpen) return null;

  // ─── Drag Drop Helpers ──────────────────────────────────────────
  const addDragDropItem = () => {
    setDragDropConfig((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: `dd-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, label: "", imageUrl: "", isCorrect: true },
      ],
    }));
  };

  const removeDragDropItem = (index: number) => {
    setDragDropConfig((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const updateDragDropItem = (index: number, fields: Partial<typeof dragDropConfig.items[0]>) => {
    setDragDropConfig((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? { ...item, ...fields } : item)),
    }));
  };

  // ─── Matching Helpers ───────────────────────────────────────────
  const addMatchingPair = () => {
    setMatchingConfig((prev) => ({
      ...prev,
      pairs: [
        ...prev.pairs,
        { id: `match-pair-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, threat: "", solution: "" },
      ],
    }));
  };

  const removeMatchingPair = (index: number) => {
    setMatchingConfig((prev) => ({
      ...prev,
      pairs: prev.pairs.filter((_, idx) => idx !== index),
    }));
  };

  const updateMatchingPair = (index: number, fields: Partial<typeof matchingConfig.pairs[0]>) => {
    setMatchingConfig((prev) => ({
      ...prev,
      pairs: prev.pairs.map((pair, idx) => (idx === index ? { ...pair, ...fields } : pair)),
    }));
  };

  // ─── Picture Choice Helpers ─────────────────────────────────────
  const addPictureChoiceOption = () => {
    setPictureChoiceConfig((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { id: `pc-opt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, label: "", imageUrl: "", isCorrect: false },
      ],
    }));
  };

  const removePictureChoiceOption = (index: number) => {
    setPictureChoiceConfig((prev) => ({
      ...prev,
      options: prev.options.filter((_, idx) => idx !== index),
    }));
  };

  const updatePictureChoiceOption = (index: number, fields: Partial<typeof pictureChoiceConfig.options[0]>) => {
    setPictureChoiceConfig((prev) => ({
      ...prev,
      options: prev.options.map((opt, idx) => (idx === index ? { ...opt, ...fields } : opt)),
    }));
  };

  // ─── Form Validation ────────────────────────────────────────────
  const validateForm = (): { valid: boolean; message?: string } => {
    if (!title.trim()) {
      return { valid: false, message: "Judul game wajib diisi" };
    }

    if (gameType === "DRAG_DROP") {
      if (dragDropConfig.items.length === 0) {
        return { valid: false, message: "Harap tambahkan minimal 1 item untuk diseret" };
      }
      for (const item of dragDropConfig.items) {
        if (!item.label.trim()) {
          return { valid: false, message: "Label item drag-drop tidak boleh kosong" };
        }
      }
    }

    if (gameType === "MATCHING") {
      if (matchingConfig.pairs.length === 0) {
        return { valid: false, message: "Harap tambahkan minimal 1 pasangan pencocokan" };
      }
      for (const pair of matchingConfig.pairs) {
        if (!pair.threat.trim() || !pair.solution.trim()) {
          return { valid: false, message: "Pasangan ancaman & solusi tidak boleh kosong" };
        }
      }
    }

    if (gameType === "PICTURE_CHOICE") {
      if (!pictureChoiceConfig.question.trim()) {
        return { valid: false, message: "Pertanyaan kuis wajib diisi" };
      }
      if (pictureChoiceConfig.options.length < 2) {
        return { valid: false, message: "Harap sediakan minimal 2 pilihan gambar" };
      }
      let correctCount = 0;
      for (const opt of pictureChoiceConfig.options) {
        if (!opt.label.trim()) {
          return { valid: false, message: "Label pilihan tidak boleh kosong" };
        }
        if (!opt.imageUrl) {
          return { valid: false, message: "Setiap pilihan wajib memiliki gambar" };
        }
        if (opt.isCorrect) correctCount++;
      }
      if (correctCount === 0) {
        return { valid: false, message: "Harap pilih minimal 1 jawaban yang benar" };
      }
    }

    return { valid: true };
  };

  // ─── Submit Handler ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm();
    if (!validation.valid) {
      setValidationError(validation.message || "Validasi gagal");
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    let gameConfig: any = {};
    if (gameType === "DRAG_DROP") {
      gameConfig = dragDropConfig;
    } else if (gameType === "MATCHING") {
      gameConfig = matchingConfig;
    } else if (gameType === "PICTURE_CHOICE") {
      gameConfig = pictureChoiceConfig;
    }

    const payload = {
      title: title.trim(),
      ageCategory,
      gameType,
      gameConfig,
    };

    let success = false;
    if (game) {
      success = await onUpdate(game.id, payload);
    } else {
      success = await onCreate(payload);
    }

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(25,28,29,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: "var(--color-surface-container-lowest)",
          boxShadow: "0px 12px 40px rgba(0,0,0,0.12)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low">
          <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary">science</span>
            {game ? "Edit Game Lab" : "Tambah Game Lab Baru"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex gap-3 text-body-md font-medium">
              <span className="material-symbols-outlined text-red-600">error</span>
              {validationError}
            </div>
          )}

          {/* Judul Game */}
          <Input
            label="Judul Permainan"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masukkan judul lab game..."
            required
            disabled={isSubmitting}
          />

          {/* Usia & Tipe Game Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="font-plus-jakarta-sans text-[12px] font-bold tracking-wider uppercase text-on-surface-variant ml-1">
                Kategori Usia
              </label>
              <div className="relative">
                <select
                  value={ageCategory}
                  onChange={(e) => setAgeCategory(e.target.value as any)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface outline-none appearance-none cursor-pointer"
                >
                  <option value="ALL">Semua Kalangan</option>
                  <option value="CHILD">Anak-anak (≤12 Tahun)</option>
                  <option value="TEEN">Remaja (13-17 Tahun)</option>
                  <option value="ADULT">Dewasa (18+ Tahun)</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="font-plus-jakarta-sans text-[12px] font-bold tracking-wider uppercase text-on-surface-variant ml-1">
                Tipe Game
              </label>
              <div className="relative">
                <select
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value as any)}
                  disabled={isSubmitting || !!game} // Tipe game tidak boleh diubah saat edit
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface outline-none appearance-none cursor-pointer disabled:bg-surface-container-low disabled:cursor-not-allowed"
                >
                  <option value="DRAG_DROP">Drag & Drop (Seret & Lepas)</option>
                  <option value="MATCHING">Pencocokan (Threats & Solutions)</option>
                  <option value="PICTURE_CHOICE">Pilihan Gambar (Kuis Bergambar)</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant/30 pt-6">
            {/* ─── DYNAMIC CONFIG AREA ─── */}

            {/* DRAG DROP CONFIG BUILDER */}
            {gameType === "DRAG_DROP" && (
              <div className="space-y-6">
                <h4 className="text-body-lg font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">ads_click</span>
                  Konfigurasi Game Drag & Drop
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <Input
                    label="Label Petunjuk Target (Opsional)"
                    value={dragDropConfig.target.label || ""}
                    onChange={(e) =>
                      setDragDropConfig((p) => ({
                        ...p,
                        target: { ...p.target, label: e.target.value },
                      }))
                    }
                    placeholder="Contoh: Seret makanan ke kandang..."
                  />

                  <ImageFieldUploader
                    label="Gambar Background Target (Opsional)"
                    value={dragDropConfig.target.imageUrl}
                    onChange={(url) =>
                      setDragDropConfig((p) => ({
                        ...p,
                        target: { ...p.target, imageUrl: url },
                      }))
                    }
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                    <span className="text-body-md font-bold text-on-surface-variant">Daftar Item Seret</span>
                    <button
                      type="button"
                      onClick={addDragDropItem}
                      className="text-primary hover:bg-primary-container/10 px-3 py-1.5 rounded-xl font-label-md transition-all flex items-center gap-1 cursor-pointer border border-transparent hover:border-outline-variant/30"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Tambah Item
                    </button>
                  </div>

                  {dragDropConfig.items.length === 0 ? (
                    <p className="text-center py-8 text-on-surface-variant text-body-sm italic">
                      Belum ada item seret. Harap tambahkan minimal satu.
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {dragDropConfig.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low/30 flex flex-col md:flex-row gap-4 items-start md:items-center"
                        >
                          <div className="flex-1 space-y-4 w-full">
                            <Input
                              label={`Nama Item #${idx + 1}`}
                              value={item.label}
                              onChange={(e) => updateDragDropItem(idx, { label: e.target.value })}
                              placeholder="Contoh: Daging Rusa"
                              required
                            />
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2.5 cursor-pointer text-body-sm font-semibold text-on-surface-variant">
                                <input
                                  type="checkbox"
                                  checked={item.isCorrect}
                                  onChange={(e) =>
                                    updateDragDropItem(idx, { isCorrect: e.target.checked })
                                  }
                                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                                />
                                Jawaban Benar (Bisa diseret ke target)
                              </label>
                            </div>
                          </div>

                          <div className="shrink-0 flex gap-4 items-end">
                            <ImageFieldUploader
                              label="Gambar Item (Opsional)"
                              value={item.imageUrl}
                              onChange={(url) => updateDragDropItem(idx, { imageUrl: url })}
                            />
                            <button
                              type="button"
                              onClick={() => removeDragDropItem(idx)}
                              className="text-red-600 hover:bg-red-50 p-2.5 rounded-full transition-colors cursor-pointer self-center"
                              title="Hapus Item"
                            >
                              <span className="material-symbols-outlined text-[20px] block">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MATCHING CONFIG BUILDER */}
            {gameType === "MATCHING" && (
              <div className="space-y-6">
                <h4 className="text-body-lg font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">compare_arrows</span>
                  Konfigurasi Game Pencocokan Pasangan
                </h4>
                <p className="text-body-sm text-on-surface-variant -mt-2">
                  Cocokkan ancaman kelestarian hewan dengan solusi perlindungan yang tepat.
                </p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                    <span className="text-body-md font-bold text-on-surface-variant">Daftar Pasangan Pencocokan</span>
                    <button
                      type="button"
                      onClick={addMatchingPair}
                      className="text-primary hover:bg-primary-container/10 px-3 py-1.5 rounded-xl font-label-md transition-all flex items-center gap-1 cursor-pointer border border-transparent hover:border-outline-variant/30"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Tambah Pasangan
                    </button>
                  </div>

                  {matchingConfig.pairs.length === 0 ? (
                    <p className="text-center py-8 text-on-surface-variant text-body-sm italic">
                      Belum ada pasangan. Harap tambahkan minimal satu.
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {matchingConfig.pairs.map((pair, idx) => (
                        <div
                          key={pair.id}
                          className="p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low/30 flex gap-4 items-end"
                        >
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label={`Ancaman #${idx + 1}`}
                              value={pair.threat}
                              onChange={(e) => updateMatchingPair(idx, { threat: e.target.value })}
                              placeholder="Contoh: Perburuan liar cula"
                              required
                            />
                            <Input
                              label={`Solusi Pasangan #${idx + 1}`}
                              value={pair.solution}
                              onChange={(e) => updateMatchingPair(idx, { solution: e.target.value })}
                              placeholder="Contoh: Patroli anti-poaching hutan"
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMatchingPair(idx)}
                            className="text-red-600 hover:bg-red-50 p-2.5 rounded-full transition-colors cursor-pointer shrink-0 mb-1"
                            title="Hapus Pasangan"
                          >
                            <span className="material-symbols-outlined text-[20px] block">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PICTURE CHOICE CONFIG BUILDER */}
            {gameType === "PICTURE_CHOICE" && (
              <div className="space-y-6">
                <h4 className="text-body-lg font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">quiz</span>
                  Konfigurasi Kuis Pilihan Gambar
                </h4>

                <Input
                  label="Pertanyaan Kuis"
                  value={pictureChoiceConfig.question}
                  onChange={(e) =>
                    setPictureChoiceConfig((p) => ({ ...p, question: e.target.value }))
                  }
                  placeholder="Contoh: Hewan mana yang termasuk karnivora?"
                  required
                />

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                    <span className="text-body-md font-bold text-on-surface-variant">Pilihan Jawaban (Min. 2 Pilihan)</span>
                    <button
                      type="button"
                      onClick={addPictureChoiceOption}
                      className="text-primary hover:bg-primary-container/10 px-3 py-1.5 rounded-xl font-label-md transition-all flex items-center gap-1 cursor-pointer border border-transparent hover:border-outline-variant/30"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Tambah Pilihan
                    </button>
                  </div>

                  {pictureChoiceConfig.options.length === 0 ? (
                    <p className="text-center py-8 text-on-surface-variant text-body-sm italic">
                      Belum ada pilihan gambar. Harap tambahkan minimal dua.
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {pictureChoiceConfig.options.map((opt, idx) => (
                        <div
                          key={opt.id}
                          className="p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low/30 flex flex-col md:flex-row gap-4 items-start md:items-center"
                        >
                          <div className="flex-1 space-y-4 w-full">
                            <Input
                              label={`Label Pilihan #${idx + 1}`}
                              value={opt.label}
                              onChange={(e) => updatePictureChoiceOption(idx, { label: e.target.value })}
                              placeholder="Contoh: Harimau Sumatra"
                              required
                            />
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2.5 cursor-pointer text-body-sm font-semibold text-on-surface-variant">
                                <input
                                  type="checkbox"
                                  checked={opt.isCorrect}
                                  onChange={(e) =>
                                    updatePictureChoiceOption(idx, { isCorrect: e.target.checked })
                                  }
                                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                                />
                                Kunci Jawaban (Pilihan Benar)
                              </label>
                            </div>
                          </div>

                          <div className="shrink-0 flex gap-4 items-end">
                            <ImageFieldUploader
                              label="Gambar Pilihan (Wajib)"
                              value={opt.imageUrl}
                              onChange={(url) => updatePictureChoiceOption(idx, { imageUrl: url })}
                            />
                            <button
                              type="button"
                              onClick={() => removePictureChoiceOption(idx)}
                              className="text-red-600 hover:bg-red-50 p-2.5 rounded-full transition-colors cursor-pointer self-center"
                              title="Hapus Pilihan"
                            >
                              <span className="material-symbols-outlined text-[20px] block">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-outline-variant/30 bg-surface-container-low">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="border border-outline-variant hover:bg-surface-container-high"
          >
            Batal
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="px-6"
          >
            {game ? "Simpan Perubahan" : "Buat Game"}
          </Button>
        </div>
      </div>
    </div>
  );
}
