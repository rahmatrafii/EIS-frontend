// src/components/admin/QuizPreviewModal.tsx
"use client";

import { useRouter } from "next/navigation";
import type { AdminQuiz } from "@/types/admin.types";
import { ROUTES } from "@/constants/routes";

interface QuizPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: AdminQuiz | null;
}

export default function QuizPreviewModal({
  isOpen,
  onClose,
  quiz,
}: QuizPreviewModalProps) {
  const router = useRouter();

  if (!isOpen || !quiz) return null;

  // --- Badge styling helper ---
  function getQuizTypeBadge(type: string) {
    switch (type) {
      case "PRE_ZOO":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
            Kuis Awal
          </span>
        );
      case "POST_ZOO":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            Kuis Akhir
          </span>
        );
      case "RETENTION_1W":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
            Retensi H+7
          </span>
        );
      case "RETENTION_1M":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800">
            Retensi H+30
          </span>
        );
      default:
        return null;
    }
  }

  // --- Age category label helper ---
  function getAgeCategoryLabel(cat: string) {
    switch (cat.toUpperCase()) {
      case "CHILD":
        return "Anak-anak";
      case "TEEN":
        return "Remaja";
      case "ADULT":
        return "Dewasa";
      default:
        return cat;
    }
  }

  function handleEditClick() {
    if (!quiz) return;
    onClose();
    router.push(`${ROUTES.admin.quizzes}/${quiz.id}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#191c1d]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative bg-surface-container-lowest w-full max-w-[600px] max-h-[90vh] rounded-[24px] shadow-[0px_10px_30px_rgba(0,0,0,0.08)] flex flex-col m-4 overflow-hidden"
        style={{
          animation: "modalFadeIn 0.2s ease-out forwards",
        }}
      >
        {/* Style block for local keyframe */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}} />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-container-high flex items-start justify-between bg-surface-bright sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-headline-sm font-headline-sm text-on-surface font-bold leading-snug">
                {quiz.title}
              </h3>
              {getQuizTypeBadge(quiz.quizType)}
            </div>
            <p className="text-sm text-on-surface-variant flex items-center gap-2 flex-wrap">
              <span>
                <strong className="text-on-surface">
                  {quiz.questions.length}
                </strong>{" "}
                Soal
              </span>
              <span>•</span>
              <span>
                Area:{" "}
                <strong className="text-on-surface">
                  {quiz.exhibitName || "Global"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Usia:{" "}
                <strong className="text-on-surface">
                  {getAgeCategoryLabel(quiz.ageCategory)}
                </strong>
              </span>
            </p>
          </div>
          <button
            className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined block">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-surface-container-lowest space-y-6">
          {quiz.questions.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              Belum ada soal untuk kuis ini.
            </div>
          ) : (
            quiz.questions.map((q, idx) => (
              <div key={q.id || idx} className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 shrink-0 bg-surface-container flex items-center justify-center rounded-full text-sm font-bold text-on-surface-variant">
                    {idx + 1}
                  </div>
                  <p className="text-body-md font-body-md text-on-surface font-medium pt-1">
                    {q.questionText}
                  </p>
                </div>

                <div className="pl-11 space-y-2">
                  {/* Option A */}
                  <div
                    className={`p-3 rounded-lg border flex items-center gap-2 relative ${
                      q.correctOption === "A"
                        ? "border-[#059669] bg-[#059669]/5"
                        : "border-surface-container-high bg-surface"
                    }`}
                  >
                    <span className="w-6 h-6 rounded flex items-center justify-center bg-surface-container-highest text-xs font-bold text-on-surface-variant shrink-0">
                      A
                    </span>
                    <span
                      className={`text-sm ${
                        q.correctOption === "A"
                          ? "font-medium text-[#059669]"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {q.optionA}
                    </span>
                    {q.correctOption === "A" && (
                      <span className="material-symbols-outlined text-[#059669] absolute right-3 text-[20px]">
                        check_circle
                      </span>
                    )}
                  </div>

                  {/* Option B */}
                  <div
                    className={`p-3 rounded-lg border flex items-center gap-2 relative ${
                      q.correctOption === "B"
                        ? "border-[#059669] bg-[#059669]/5"
                        : "border-surface-container-high bg-surface"
                    }`}
                  >
                    <span className="w-6 h-6 rounded flex items-center justify-center bg-surface-container-highest text-xs font-bold text-on-surface-variant shrink-0">
                      B
                    </span>
                    <span
                      className={`text-sm ${
                        q.correctOption === "B"
                          ? "font-medium text-[#059669]"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {q.optionB}
                    </span>
                    {q.correctOption === "B" && (
                      <span className="material-symbols-outlined text-[#059669] absolute right-3 text-[20px]">
                        check_circle
                      </span>
                    )}
                  </div>

                  {/* Option C */}
                  <div
                    className={`p-3 rounded-lg border flex items-center gap-2 relative ${
                      q.correctOption === "C"
                        ? "border-[#059669] bg-[#059669]/5"
                        : "border-surface-container-high bg-surface"
                    }`}
                  >
                    <span className="w-6 h-6 rounded flex items-center justify-center bg-surface-container-highest text-xs font-bold text-on-surface-variant shrink-0">
                      C
                    </span>
                    <span
                      className={`text-sm ${
                        q.correctOption === "C"
                          ? "font-medium text-[#059669]"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {q.optionC}
                    </span>
                    {q.correctOption === "C" && (
                      <span className="material-symbols-outlined text-[#059669] absolute right-3 text-[20px]">
                        check_circle
                      </span>
                    )}
                  </div>

                  {/* Option D */}
                  <div
                    className={`p-3 rounded-lg border flex items-center gap-2 relative ${
                      q.correctOption === "D"
                        ? "border-[#059669] bg-[#059669]/5"
                        : "border-surface-container-high bg-surface"
                    }`}
                  >
                    <span className="w-6 h-6 rounded flex items-center justify-center bg-surface-container-highest text-xs font-bold text-on-surface-variant shrink-0">
                      D
                    </span>
                    <span
                      className={`text-sm ${
                        q.correctOption === "D"
                          ? "font-medium text-[#059669]"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {q.optionD}
                    </span>
                    {q.correctOption === "D" && (
                      <span className="material-symbols-outlined text-[#059669] absolute right-3 text-[20px]">
                        check_circle
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-surface-container-high bg-surface-bright flex justify-end gap-3 shrink-0">
          <button
            className="px-4 py-2 text-sm font-semibold text-on-surface-variant bg-surface hover:bg-surface-container-high border border-outline-variant rounded-xl transition-colors active:scale-95"
            onClick={onClose}
          >
            Tutup Preview
          </button>
          <button
            className="px-4 py-2 text-sm font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors flex items-center gap-2 active:scale-95"
            onClick={handleEditClick}
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Kuis Ini
          </button>
        </div>
      </div>
    </div>
  );
}
