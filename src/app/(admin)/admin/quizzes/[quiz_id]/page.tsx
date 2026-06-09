// src/app/(admin)/admin/quizzes/[quiz_id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/stores/ToastContext";
import { ROUTES } from "@/constants/routes";
import { getAdminExhibits, getAdminQuizDetail, createAdminQuiz, updateAdminQuiz } from "@/services/admin.service";
import { validateQuizForm } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { AdminExhibit } from "@/types/admin.types";
import { cn } from "@/lib/cn";

interface QuestionDraft {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D" | "";
  points: number;
}

interface QuizFormState {
  title: string;
  quizType: "PRE_ZOO" | "POST_ZOO" | "RETENTION_1W" | "RETENTION_1M";
  ageCategory: "CHILD" | "TEEN" | "ADULT";
  scope: "GLOBAL" | "EXHIBIT";
  exhibitId: string;
}

export default function QuizBuilderPage() {
  const { quiz_id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const isNew = quiz_id === "new";

  // --- States ---
  const [form, setForm] = useState<QuizFormState>({
    title: "",
    quizType: "PRE_ZOO",
    ageCategory: "CHILD",
    scope: "GLOBAL",
    exhibitId: "",
  });

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      id: "initial-q-1",
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "",
      points: 10,
    },
  ]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [exhibits, setExhibits] = useState<AdminExhibit[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Stepper ref for scroll alignment
  const stepperRef = useRef<HTMLDivElement>(null);

  // --- Fetch Exhibits List ---
  useEffect(() => {
    async function loadExhibits() {
      const res = await getAdminExhibits();
      if (res.success && res.data) {
        setExhibits(res.data.filter((ex) => ex.is_active));
      }
    }
    loadExhibits();
  }, []);

  // --- Load Quiz details in view/edit mode ---
  useEffect(() => {
    if (!quiz_id) return;
    
    if (isNew) {
      setIsReadOnly(false);
      setIsLoading(false);
      return;
    }

    async function loadQuizDetail() {
      setIsLoading(true);
      try {
        const res = await getAdminQuizDetail(Number(quiz_id));
        if (res.success) {
          const quiz = res.data;
          setForm({
            title: quiz.title,
            quizType: quiz.quizType,
            ageCategory: quiz.ageCategory,
            scope: quiz.scope,
            exhibitId: quiz.exhibitId !== null ? String(quiz.exhibitId) : "",
          });

          const mappedQuestions = quiz.questions.map((q) => ({
            id: String(q.id),
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            points: q.points,
          }));

          setQuestions(mappedQuestions);
          setIsReadOnly(false);
        } else {
          toast.error(res.error?.message || "Gagal memuat detail kuis.");
          router.push(ROUTES.admin.quizzes);
        }
      } catch (err) {
        toast.error("Gagal memuat detail kuis.");
        router.push(ROUTES.admin.quizzes);
      } finally {
        setIsLoading(false);
      }
    }

    loadQuizDetail();
  }, [quiz_id, isNew, router, toast]);

  // Scroll active stepper item into view
  useEffect(() => {
    if (stepperRef.current) {
      const activeEl = stepperRef.current.children[activeIndex * 2]; // *2 because of dividers
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeIndex]);

  // --- Form Handlers ---
  function handleFormChange(field: keyof QuizFormState, value: any) {
    if (isReadOnly) return;
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset exhibitId if scope changes to global
      if (field === "scope" && value === "GLOBAL") {
        updated.exhibitId = "";
      }
      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  function handleQuestionChange(field: keyof QuestionDraft, value: any) {
    if (isReadOnly) return;
    setQuestions((prev) => {
      const updated = [...prev];
      updated[activeIndex] = { ...updated[activeIndex], [field]: value };
      return updated;
    });

    // Clear specific field errors
    const errorKey = `question_${activeIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
    // Also clear general questions error if present
    if (errors.questions) {
      setErrors((prev) => ({ ...prev, questions: "" }));
    }
  }

  // --- Question Management ---
  function handleAddQuestion() {
    if (isReadOnly) return;
    if (questions.length >= 50) {
      toast.error("Maksimal kuis hanya boleh memiliki 50 soal.");
      return;
    }

    const newQ: QuestionDraft = {
      id: `q-${Date.now()}-${Math.random()}`,
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "",
      points: 10,
    };

    setQuestions((prev) => [...prev, newQ]);
    setActiveIndex(questions.length); // go to the new question
  }

  function handleDeleteQuestion() {
    if (isReadOnly) return;
    if (questions.length <= 1) {
      toast.error("Kuis harus memiliki minimal 1 soal.");
      return;
    }

    setQuestions((prev) => prev.filter((_, idx) => idx !== activeIndex));
    setActiveIndex((prev) => Math.max(0, prev - 1));
    toast.success(`Soal ${activeIndex + 1} berhasil dihapus.`);
  }

  // --- Helper to verify if a question is complete ---
  function isQuestionComplete(q: QuestionDraft) {
    return (
      q.questionText.trim() !== "" &&
      q.optionA.trim() !== "" &&
      q.optionB.trim() !== "" &&
      q.optionC.trim() !== "" &&
      q.optionD.trim() !== "" &&
      q.correctOption !== ""
    );
  }

  const completedCount = questions.filter(isQuestionComplete).length;
  const progressPercent = questions.length > 0 ? (completedCount / questions.length) * 100 : 0;

  // --- Submit ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isReadOnly) return;

    // Build validator payload
    const validatorPayload = {
      title: form.title,
      quizType: form.quizType,
      ageCategory: form.ageCategory,
      scope: form.scope,
      exhibitId: form.scope === "EXHIBIT" ? (form.exhibitId ? Number(form.exhibitId) : null) : null,
      questions: questions.map((q) => ({
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        points: q.points,
      })),
    };

    const validationErrors = validateQuizForm(validatorPayload);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Scroll to the first question that has an error or select it
      const firstErrorKey = Object.keys(validationErrors)[0];
      if (firstErrorKey.startsWith("question_")) {
        const match = firstErrorKey.match(/question_(\d+)_/);
        if (match && match[1]) {
          const errIdx = parseInt(match[1], 10);
          setActiveIndex(errIdx);
          toast.error(`Ada kesalahan pengisian pada Soal ${errIdx + 1}`);
        }
      } else {
        toast.error("Mohon lengkapi informasi kuis di panel kiri.");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        quizType: form.quizType,
        scope: form.scope,
        ageCategory: form.ageCategory,
        exhibitId: form.scope === "EXHIBIT" ? Number(form.exhibitId) : null,
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          optionA: q.optionA.trim(),
          optionB: q.optionB.trim(),
          optionC: q.optionC.trim(),
          optionD: q.optionD.trim(),
          correctOption: q.correctOption as "A" | "B" | "C" | "D",
          points: Number(q.points),
        })),
      };

      const result = isNew
        ? await createAdminQuiz(payload)
        : await updateAdminQuiz(Number(quiz_id), payload);

      setIsSubmitting(false);

      if (result.success) {
        toast.success(isNew ? "Kuis berhasil disimpan!" : "Kuis berhasil diperbarui!");
        setShowSuccessOverlay(true);
      } else {
        toast.error(result.error.message);
      }
    } catch (err) {
      setIsSubmitting(false);
      toast.error("Terjadi kesalahan sistem saat menyimpan kuis.");
    }
  }

  function handleCreateAnother() {
    setForm({
      title: "",
      quizType: "PRE_ZOO",
      ageCategory: "CHILD",
      scope: "GLOBAL",
      exhibitId: "",
    });
    setQuestions([
      {
        id: `q-${Date.now()}`,
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "",
        points: 10,
      },
    ]);
    setActiveIndex(0);
    setErrors({});
    setShowSuccessOverlay(false);
  }

  // --- Loading screen ---
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Spinner className="h-12 w-12 text-primary" />
        <p className="font-label-md text-label-md text-on-surface">
          Memuat data kuis...
        </p>
      </div>
    );
  }

  const currentQ = questions[activeIndex];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-120px)]">
      {/* ────────────── CSS Helpers ────────────── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .hide-scrollbar::-webkit-scrollbar {
              display: none;
          }
          .hide-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
          }
        `,
        }}
      />

      {/* ────────────── Breadcrumb & Header ────────────── */}
      <div className="shrink-0 flex items-center justify-between">
        <nav
          aria-label="Breadcrumb"
          className="flex font-label-sm text-label-sm"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          <ol className="inline-flex items-center gap-2">
            <li>
              <button
                onClick={() => router.push(ROUTES.admin.dashboard)}
                className="hover:text-primary transition-colors cursor-pointer font-semibold"
              >
                ZooLogix Admin
              </button>
            </li>
            <li>
              <span className="material-symbols-outlined text-outline/50 select-none text-[14px]">chevron_right</span>
            </li>
            <li>
              <button
                onClick={() => router.push(ROUTES.admin.quizzes)}
                className="hover:text-primary transition-colors cursor-pointer font-semibold"
              >
                Kuis
              </button>
            </li>
            <li>
              <span className="material-symbols-outlined text-outline/50 select-none text-[14px]">chevron_right</span>
            </li>
            <li aria-current="page">
              <span className="font-bold" style={{ color: "var(--color-primary)" }}>
                {isNew ? "Buat Kuis Baru" : "Detail Kuis"}
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* ────────────── Split Layout Canvas ────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0 relative">
        
        {/* Left Panel: Quiz Information */}
        <div className="w-full lg:w-[35%] flex flex-col gap-4 min-h-0">
          <div
            className="bg-surface-container-lowest rounded-2xl p-6 flex-1 overflow-y-auto"
            style={{
              border: "1px solid rgba(189,201,193,0.3)",
              boxShadow: "0px 4px 20px rgba(0,0,0,0.02)",
            }}
          >
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-6">
              Informasi Kuis
            </h2>
            <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-4">
              
              {/* Quiz Title */}
              <Input
                label="Judul Kuis"
                value={form.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                error={errors.title}
                placeholder="Masukkan judul kuis..."
                disabled={isReadOnly}
                required
              />

              {/* Quiz Type */}
              <div className="flex flex-col gap-1 w-full">
                <label className="block text-label-md font-label-md text-on-surface-variant mb-2 ml-1">
                  Tipe Kuis <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.quizType}
                    onChange={(e) => handleFormChange("quizType", e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border bg-white text-on-surface transition-all cursor-pointer appearance-none focus:outline-none border-outline-variant/60 hover:border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-container-low"
                  >
                    <option value="PRE_ZOO">PRE_ZOO (Kuis Awal)</option>
                    <option value="POST_ZOO">POST_ZOO (Kuis Akhir)</option>
                    <option value="RETENTION_1W">RETENTION_1W (Retensi H+7)</option>
                    <option value="RETENTION_1M">RETENTION_1M (Retensi H+30)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none select-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Age Category */}
              <div className="flex flex-col gap-1 w-full">
                <label className="block text-label-md font-label-md text-on-surface-variant mb-2 ml-1">
                  Kategori Usia <span className="text-error">*</span>
                </label>
                <div className="flex rounded-xl border border-outline-variant/60 overflow-hidden bg-white">
                  {(["CHILD", "TEEN", "ADULT"] as const).map((cat) => {
                    const labelMap = { CHILD: "Anak", TEEN: "Remaja", ADULT: "Dewasa" };
                    const isChecked = form.ageCategory === cat;
                    return (
                      <label
                        key={cat}
                        className={cn(
                          "flex-1 text-center py-2.5 text-xs font-semibold transition-all cursor-pointer border-r border-outline-variant/60 last:border-r-0",
                          isChecked
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-transparent text-on-surface-variant hover:bg-surface-container-low",
                          isReadOnly && "cursor-not-allowed opacity-80"
                        )}
                      >
                        <input
                          type="radio"
                          name="ageCategory"
                          className="peer sr-only"
                          checked={isChecked}
                          onChange={() => handleFormChange("ageCategory", cat)}
                          disabled={isReadOnly}
                        />
                        {labelMap[cat]}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Scope */}
              <div className="flex flex-col gap-2 w-full pt-1">
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">
                  Cakupan Kuis <span className="text-error">*</span>
                </label>
                <div className="flex gap-6 items-center px-1 py-1">
                  <label className={cn("flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface", isReadOnly && "cursor-not-allowed")}>
                    <input
                      type="radio"
                      name="scope"
                      value="GLOBAL"
                      checked={form.scope === "GLOBAL"}
                      onChange={() => handleFormChange("scope", "GLOBAL")}
                      disabled={isReadOnly}
                      className="text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer disabled:cursor-not-allowed border-outline-variant/60"
                    />
                    Global
                  </label>
                  <label className={cn("flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface", isReadOnly && "cursor-not-allowed")}>
                    <input
                      type="radio"
                      name="scope"
                      value="EXHIBIT"
                      checked={form.scope === "EXHIBIT"}
                      onChange={() => handleFormChange("scope", "EXHIBIT")}
                      disabled={isReadOnly}
                      className="text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer disabled:cursor-not-allowed border-outline-variant/60"
                    />
                    Spesifik Kandang
                  </label>
                </div>

                {/* Exhibit selector */}
                {form.scope === "EXHIBIT" && (
                  <div className="relative mt-2 fade-in-up">
                    <select
                      value={form.exhibitId}
                      onChange={(e) => handleFormChange("exhibitId", e.target.value)}
                      disabled={isReadOnly}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-white text-on-surface transition-all cursor-pointer appearance-none focus:outline-none border-outline-variant/60 hover:border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-container-low",
                        errors.exhibitId ? "border-error focus:border-error focus:ring-error" : "border-outline-variant/60"
                      )}
                    >
                      <option value="">Pilih Kandang...</option>
                      {exhibits.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none select-none">
                      arrow_drop_down
                    </span>
                    {errors.exhibitId && (
                      <span className="text-error text-xs ml-1 mt-1 block">{errors.exhibitId}</span>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* Question Summary Progress */}
            <div className="mt-8 border-t border-outline/10 pt-6">
              <div className="flex justify-between items-center text-xs font-bold text-on-surface mb-2">
                <span>Ringkasan Soal</span>
                <span className="text-primary font-bold">{questions.length} Total</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-surface-container rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Question Chips Grid */}
              <div className="grid grid-cols-5 gap-2" id="question-chips-grid">
                {questions.map((q, idx) => {
                  const isActive = idx === activeIndex;
                  const isDone = isQuestionComplete(q);
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveIndex(idx)}
                      title={`Soal ${idx + 1} (${isDone ? "Lengkap" : "Kosong"})`}
                      className={cn(
                        "aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all border cursor-pointer hover:scale-105 active:scale-95",
                        isActive
                          ? "bg-primary text-on-primary border-primary shadow-sm scale-105"
                          : isDone
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                          : "bg-surface-container text-on-surface-variant border-outline-variant/40"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              {errors.questions && (
                <span className="text-error text-xs block mt-2 text-center">{errors.questions}</span>
              )}
            </div>
          </div>

          {/* Action buttons (Batal / Simpan) */}
          <div className="shrink-0 flex flex-col gap-2">
            {!isReadOnly && (
              <Button
                onClick={handleSubmit}
                isLoading={isSubmitting}
                className="w-full h-12 rounded-xl text-sm font-bold shadow-sm cursor-pointer"
                id="submit-quiz-button"
              >
                Simpan Kuis
                <span className="material-symbols-outlined ml-2 text-[18px] select-none">check</span>
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => router.push(ROUTES.admin.quizzes)}
              className="w-full h-12 rounded-xl text-sm border border-outline-variant/60 hover:border-outline-variant/80 cursor-pointer"
            >
              {isReadOnly ? "Kembali ke Daftar" : "Batal"}
            </Button>
          </div>
        </div>

        {/* Right Panel: Question Builder */}
        <div
          className="w-full lg:w-[65%] flex flex-col rounded-2xl overflow-hidden min-h-0 bg-surface-container-lowest"
          style={{
            border: "1px solid rgba(189,201,193,0.3)",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-outline/10 flex justify-between items-center bg-surface-container-low/30 shrink-0">
            <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
              Soal {activeIndex + 1} dari {questions.length}
            </h2>
            {!isReadOnly && (
              <button
                onClick={handleAddQuestion}
                disabled={questions.length >= 50}
                className="bg-primary/[0.08] text-primary hover:bg-primary hover:text-on-primary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] select-none">add</span>
                Tambah Soal
              </button>
            )}
          </div>

          {/* Horizontal Stepper (Scrollable) */}
          <div
            ref={stepperRef}
            className="px-6 py-3 bg-surface-container-low/10 border-b border-outline/15 overflow-x-auto hide-scrollbar flex gap-2 items-center shrink-0"
          >
            {questions.map((q, idx) => {
              const isActive = idx === activeIndex;
              const isDone = isQuestionComplete(q);
              return (
                <div key={q.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-all hover:scale-105 active:scale-95",
                      isActive
                        ? "bg-primary text-on-primary border-primary shadow-sm"
                        : isDone
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                        : "bg-surface-container text-on-surface-variant border-outline-variant/40"
                    )}
                  >
                    {isDone && (
                      <span className="material-symbols-outlined text-[14px] select-none">check_circle</span>
                    )}
                    Soal {idx + 1}
                  </button>
                  {idx < questions.length - 1 && (
                    <div className="h-[1px] w-4 bg-outline-variant/40 mx-1 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Question Form Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-surface-container-lowest">
            {currentQ ? (
              <div className="border border-outline-variant/40 rounded-2xl p-6 bg-surface-container-lowest/50 space-y-6">
                
                {/* Question text */}
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                      Pertanyaan
                    </label>
                    <span className="text-xs text-outline/80">
                      {currentQ.questionText.length}/500
                    </span>
                  </div>
                  <textarea
                    value={currentQ.questionText}
                    onChange={(e) => handleQuestionChange("questionText", e.target.value.slice(0, 500))}
                    disabled={isReadOnly}
                    placeholder="Tuliskan pertanyaan di sini..."
                    rows={3}
                    className={cn(
                      "w-full px-4 py-3 border rounded-xl bg-white text-on-surface text-sm transition-all resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed",
                      errors[`question_${activeIndex}_text`] ? "border-error focus:border-error focus:ring-error" : "border-outline-variant/60"
                    )}
                  />
                  {errors[`question_${activeIndex}_text`] && (
                    <span className="text-error text-xs ml-1 block mt-1">{errors[`question_${activeIndex}_text`]}</span>
                  )}
                </div>

                {/* Answers list */}
                <div className="space-y-3">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-on-surface-variant ml-1 block">
                    Pilihan Jawaban
                  </label>

                  {(["A", "B", "C", "D"] as const).map((opt) => {
                    const optionField = `option${opt}` as keyof QuestionDraft;
                    const isCorrect = currentQ.correctOption === opt;
                    const optVal = currentQ[optionField] as string;

                    return (
                      <div key={opt} className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border transition-all select-none",
                            isCorrect
                              ? "bg-primary text-on-primary border-primary shadow-sm"
                              : "bg-surface-container text-on-surface-variant border-outline-variant/40"
                          )}
                        >
                          {opt}
                        </div>
                        <input
                          type="text"
                          value={optVal}
                          onChange={(e) => handleQuestionChange(optionField, e.target.value)}
                          disabled={isReadOnly}
                          placeholder={`Pilihan ${opt}...`}
                          className={cn(
                            "w-full px-4 py-2.5 rounded-xl border text-sm transition-all bg-white focus:outline-none disabled:cursor-not-allowed",
                            isCorrect
                              ? "border-2 border-primary font-semibold focus:border-primary/80"
                              : "border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/10",
                            errors[`question_${activeIndex}_${optionField}`] && "border-error"
                          )}
                        />
                      </div>
                    );
                  })}
                  
                  {/* General answers errors */}
                  {((errors[`question_${activeIndex}_optionA`] || errors[`question_${activeIndex}_optionB`] || errors[`question_${activeIndex}_optionC`] || errors[`question_${activeIndex}_optionD`])) && (
                    <span className="text-error text-xs ml-1 block mt-1">
                      Semua pilihan jawaban A, B, C, dan D wajib diisi.
                    </span>
                  )}
                </div>

                {/* Correct option */}
                <div className="bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/20">
                  
                  {/* Correct Option Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                      Jawaban Benar <span className="text-error">*</span>
                    </label>
                    <div className="flex gap-2">
                      {(["A", "B", "C", "D"] as const).map((opt) => {
                        const isChecked = currentQ.correctOption === opt;
                        return (
                          <label key={opt} className="cursor-pointer">
                            <input
                              type="radio"
                              name="correct_answer"
                              className="peer sr-only"
                              checked={isChecked}
                              onChange={() => handleQuestionChange("correctOption", opt)}
                              disabled={isReadOnly}
                            />
                            <div className="w-10 h-10 rounded-xl border border-outline-variant/60 flex items-center justify-center text-xs font-bold transition-all bg-white peer-checked:border-primary peer-checked:bg-primary/[0.08] peer-checked:text-primary peer-checked:scale-105 hover:bg-surface-container peer-checked:font-extrabold disabled:opacity-50 select-none">
                              {opt}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {errors[`question_${activeIndex}_correctOption`] && (
                      <span className="text-error text-xs block mt-1">{errors[`question_${activeIndex}_correctOption`]}</span>
                    )}
                  </div>

                </div>

              </div>
            ) : null}
          </div>

          {/* Builder Footer (Navigation & Delete Question) */}
          <div className="px-6 py-4 border-t border-outline/10 bg-surface-container-low/20 flex justify-between items-center shrink-0">
            {!isReadOnly ? (
              <button
                onClick={handleDeleteQuestion}
                disabled={questions.length <= 1}
                className="text-error hover:bg-error/10 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Hapus soal aktif"
              >
                <span className="material-symbols-outlined text-[18px] select-none">delete</span>
                Hapus Soal
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
                className="border border-outline-variant flex items-center gap-1 rounded-xl cursor-pointer"
                size="sm"
              >
                <span className="material-symbols-outlined text-[16px] select-none">arrow_back</span>
                Sebelumnya
              </Button>
              <Button
                variant="secondary"
                onClick={() => setActiveIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={activeIndex === questions.length - 1}
                className="flex items-center gap-1 rounded-xl cursor-pointer"
                size="sm"
              >
                Selanjutnya
                <span className="material-symbols-outlined text-[16px] select-none">arrow_forward</span>
              </Button>
            </div>
          </div>

        </div>

      </div>

      {/* ────────────── Success Overlay Modal ────────────── */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-inverse-surface/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="p-8 rounded-3xl text-center flex flex-col items-center max-w-md w-full bg-surface-container-lowest"
            style={{
              border: "1px solid rgba(189,201,193,0.35)",
              boxShadow: "0px 10px 40px rgba(0,0,0,0.04)",
            }}
          >
            
            <div className="w-16 h-16 bg-primary/[0.08] rounded-full flex items-center justify-center text-primary mb-6 shadow-sm animate-scale-in">
              <span className="material-symbols-outlined select-none" style={{ fontSize: "32px", fontWeight: "bold" }}>
                check_circle
              </span>
            </div>

            <h2 className="text-headline-md font-headline-md font-bold text-on-surface mb-2">
              {isNew ? "Kuis Berhasil Disimpan!" : "Kuis Berhasil Diperbarui!"}
            </h2>
            <p className="text-body-sm text-outline/80 mb-6 break-words w-full">
              Kuis &ldquo;{form.title}&rdquo; telah berhasil {isNew ? "ditambahkan ke" : "diperbarui di"} database.
            </p>

            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={() => {
                  setShowSuccessOverlay(false);
                  router.push(ROUTES.admin.quizzes);
                }}
                className="w-full h-11 rounded-xl cursor-pointer shadow-sm"
              >
                Lihat Daftar Kuis
              </Button>
              {isNew && (
                <Button
                  variant="secondary"
                  onClick={handleCreateAnother}
                  className="w-full h-11 rounded-xl cursor-pointer"
                >
                  Buat Kuis Lain
                </Button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
