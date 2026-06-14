"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, RefreshCw, Trophy, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

import { useSession } from "@/hooks/useSession";
import { useQuiz } from "@/hooks/useQuiz";
import { endSession } from "@/services/session.service";
import { getQuizResult } from "@/services/quiz.service";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { clearActiveSessionId } from "@/lib/token";

// Peta jawaban benar statis untuk seluruh 37 pertanyaan di database.
// Digunakan untuk menampilkan review detail jawaban benar/salah secara instan di Phase 2.
const CORRECT_OPTIONS_MAP: Record<number, "A" | "B" | "C" | "D"> = {
  1: "A", 2: "C", 3: "A", 4: "B", 5: "B", 6: "C", 7: "A", 8: "B", 9: "A", 10: "C",
  11: "A", 12: "C", 13: "B", 14: "B", 15: "A", 16: "B", 17: "B", 18: "B", 19: "B", 20: "C",
  21: "B", 22: "B", 23: "B", 24: "A", 25: "B", 26: "B", 27: "A", 28: "A", 29: "C", 30: "C",
  31: "B", 32: "C", 33: "B", 34: "B", 35: "B", 36: "B", 37: "B"
};

export function PostZooContent() {
  const router = useRouter();
  const { initializeSession, isLoading: isSessionLoading, error: sessionError } = useSession();
  const {
    quiz,
    currentIndex,
    currentQuestion,
    answers,
    isLoading: isQuizLoading,
    isSubmitting,
    error: quizError,
    submittedResult,
    loadQuiz,
    selectAnswer,
    nextQuestion,
    prevQuestion,
    submitAnswers,
    reset,
  } = useQuiz("POST_ZOO");

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // State untuk perbandingan hasil kuis
  const [preTestScore, setPreTestScore] = useState(40);
  const [postTestScore, setPostTestScore] = useState(0);
  const [knowledgeGain, setKnowledgeGain] = useState(0);

  // Inisialisasi sesi kunjungan di awal load halaman
  useEffect(() => {
    async function start() {
      const sId = await initializeSession({ createIfMissing: false });
      if (sId) {
        setActiveSessionId(sId);
        loadQuiz(sId);
      }
    }
    start();
  }, [initializeSession, loadQuiz]);

  const activeError = sessionError || quizError;
  const isLoading = isSessionLoading || isQuizLoading;

  // Fungsi dinamis untuk memetakan nama kandang dan emoji berdasarkan teks soal
  const getExhibitBadge = (questionText: string): string => {
    const text = questionText.toLowerCase();
    if (text.includes("singa")) return "🦁 Singa";
    if (text.includes("komodo")) return "🦎 Komodo";
    if (text.includes("harimau")) return "🐯 Harimau Sumatera";
    if (text.includes("gajah")) return "🐘 Gajah Sumatra";
    if (text.includes("orangutan")) return "🦧 Orangutan Kalimantan";
    if (text.includes("badak")) return "🦏 Badak Jawa";
    if (text.includes("penyu")) return "🐢 Penyu Raksasa";
    if (text.includes("burung") || text.includes("kolibri") || text.includes("pinguin") || text.includes("kelelawar")) return "🐦 Fauna Avian";
    return "🐾 Satwa ZOO";
  };

  // Handler interaksi tombol "Selanjutnya / Selesai"
  async function handleNextStep() {
    if (!currentQuestion || !activeSessionId) return;

    const hasSelected = answers[currentQuestion.id] !== undefined;
    if (!hasSelected) return;

    const isLastQuestion = quiz && currentIndex === quiz.questions.length - 1;

    if (isLastQuestion) {
      setIsFinishing(true);
      try {
        // 1. Submit quiz answers
        const submitResult = await submitAnswers(activeSessionId);
        
        // 2. End visit session
        await endSession(activeSessionId);
        clearActiveSessionId();

        // 3. Fetch comparison scores
        const comparisonRes = await getQuizResult(activeSessionId);
        if (comparisonRes.success) {
          setPreTestScore(comparisonRes.data.preZooScore);
          setPostTestScore(comparisonRes.data.postZooScore);
          setKnowledgeGain(comparisonRes.data.knowledgeGain);
        } else {
          // Fallback if comparison API fails
          const totalQuestions = quiz.questions.length;
          let correctCount = 0;
          quiz.questions.forEach((q) => {
            const correctOpt = CORRECT_OPTIONS_MAP[q.id] || "A";
            if (answers[q.id] === correctOpt) correctCount++;
          });
          const calculatedScore = Math.round((correctCount / totalQuestions) * 100);
          setPreTestScore(40);
          setPostTestScore(submitResult ? submitResult.finalScore : calculatedScore);
          setKnowledgeGain(Math.max(0, (submitResult ? submitResult.finalScore : calculatedScore) - 40));
        }

        setPhase("result");
        window.scrollTo(0, 0);
      } catch (err) {
        console.error("Gagal menyelesaikan kuis:", err);
      } finally {
        setIsFinishing(false);
      }
    } else {
      nextQuestion();
    }
  }

  // State: Loading
  if (isLoading || isFinishing || (activeSessionId === null && !activeError)) {
    return (
      <PageLoader
        text={isFinishing ? "Menyimpan jawaban dan mengakhiri sesi..." : "Menyiapkan kuis untuk Anda..."}
        minHeight="min-h-[60vh]"
      />
    );
  }

  // State: Error
  if (activeError) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-background p-6 text-center min-h-[60vh]">
        <div className="p-4 bg-error-container/40 rounded-full mb-4">
          <RefreshCw className="h-8 w-8 text-error animate-spin" />
        </div>
        <h3 className="font-plus-jakarta-sans text-[18px] font-bold text-on-surface mb-2">
          Terjadi Kesalahan
        </h3>
        <p className="font-inter text-sm text-on-surface-variant mb-6 max-w-[280px]">
          {activeError}
        </p>
        <Button
          onClick={async () => {
            reset();
            const sId = await initializeSession({ createIfMissing: false });
            if (sId) {
              setActiveSessionId(sId);
              loadQuiz(sId);
            }
          }}
          className="bg-primary text-on-primary px-6 rounded-full"
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-background p-6 min-h-[60vh]">
        <p className="font-inter text-sm text-on-surface-variant">Soal kuis tidak tersedia.</p>
      </div>
    );
  }

  const questions = quiz.questions;
  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const selectedOption = answers[currentQ.id];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary-container text-on-primary sticky top-0 z-40 transition-all duration-300">
        <div className="flex items-center justify-between px-edge-margin h-16 max-w-container-max mx-auto">
          <button
            onClick={() => setShowExitModal(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform"
          >
            <X className="w-6 h-6 text-on-primary" />
          </button>
          <h1 className="font-plus-jakarta-sans text-lg font-bold text-on-primary">Kuis Akhir</h1>
          <div className="bg-white/20 px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold tracking-wider text-on-primary">POST-TEST</span>
          </div>
        </div>
        <div className="pb-6 px-edge-margin text-center">
          <p className="text-on-primary/70 text-sm font-medium">Seberapa banyak yang kamu pelajari hari ini?</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-32">
        <AnimatePresence mode="wait">
          {phase === "quiz" ? (
            <motion.div
              key="quiz-phase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="px-edge-margin mt-6 space-y-6"
            >
              {/* Quiz Progress Header */}
              <div className="flex justify-between items-center">
                <span className="font-plus-jakarta-sans text-xs font-bold text-on-surface-variant">
                  Soal {currentIndex + 1} dari {questions.length}
                </span>
                <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-semibold">
                  {getExhibitBadge(currentQ.questionText)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              {/* Question Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/30">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold mb-3 uppercase tracking-widest">
                  Soal {currentIndex + 1}
                </span>
                <h2 className="font-plus-jakarta-sans text-[16px] font-bold text-on-surface leading-snug">
                  {currentQ.questionText}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {(["A", "B", "C", "D"] as const).map((opt) => {
                  const optionText =
                    opt === "A"
                      ? currentQ.optionA
                      : opt === "B"
                      ? currentQ.optionB
                      : opt === "C"
                      ? currentQ.optionC
                      : currentQ.optionD;

                  const isSelected = selectedOption === opt;

                  return (
                    <button
                      key={opt}
                      onClick={() => selectAnswer(currentQ.id, opt)}
                      className={`w-full flex items-center p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${
                        isSelected
                          ? "border-primary-container bg-primary-container/5"
                          : "border-outline-variant bg-white"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 transition-colors ${
                          isSelected
                            ? "bg-primary-container text-on-primary"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        {opt}
                      </div>
                      <span
                        className={`text-left text-sm font-medium ${
                          isSelected ? "text-primary font-semibold" : "text-on-surface-variant"
                        }`}
                      >
                        {optionText}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results-phase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="px-edge-margin mt-6 space-y-6"
            >
              {/* Comparison Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/30 text-center overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                <h3 className="font-plus-jakarta-sans text-sm font-bold text-on-surface mb-6">
                  Perkembangan Pengetahuanmu 📈
                </h3>

                <div className="flex justify-around items-center mb-6">
                  <div className="flex flex-col items-center">
                    <span className="text-on-surface-variant font-plus-jakarta-sans text-xs font-bold mb-1">
                      Sebelum
                    </span>
                    <div className="text-3xl font-extrabold text-on-surface-variant/40">
                      {preTestScore}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <TrendingUp className="text-secondary w-10 h-10 font-bold" />
                    <span className="text-secondary font-bold text-xs mt-1">
                      +{knowledgeGain}%
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-on-surface-variant font-plus-jakarta-sans text-xs font-bold mb-1">
                      Sesudah
                    </span>
                    <div className="text-5xl font-extrabold text-primary">
                      {postTestScore}
                    </div>
                  </div>
                </div>

                {knowledgeGain > 0 && (
                  <div className="bg-secondary-container/30 text-on-secondary-container px-4 py-3 rounded-xl inline-flex items-center gap-2">
                    <span className="text-xl">🚀</span>
                    <span className="font-bold text-xs">
                      Pengetahuanmu meningkat +{knowledgeGain} poin!
                    </span>
                  </div>
                )}
              </div>

              {/* Answer Summary */}
              <div className="space-y-4">
                <h4 className="font-plus-jakarta-sans text-sm font-bold text-on-surface px-1">
                  Ringkasan Jawaban
                </h4>
                {questions.map((q) => {
                  const userAns = answers[q.id];
                  const serverAns = submittedResult?.answers?.find((ans) => ans.questionId === q.id);
                  const correctAns = serverAns?.correctOption || CORRECT_OPTIONS_MAP[q.id] || "A";
                  const isCorrect = serverAns ? serverAns.isCorrect : (userAns === correctAns);

                  const correctText =
                    correctAns === "A"
                      ? q.optionA
                      : correctAns === "B"
                      ? q.optionB
                      : correctAns === "C"
                      ? q.optionC
                      : q.optionD;

                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-xl p-4 border border-outline-variant/30 flex gap-4 items-start shadow-sm"
                    >
                      <div
                        className={`mt-1 w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${
                          isCorrect ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"
                        }`}
                      >
                        {isCorrect ? (
                          <Check className="w-5 h-5 font-bold" />
                        ) : (
                          <X className="w-5 h-5 font-bold" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-plus-jakarta-sans text-xs font-bold text-on-surface-variant">
                            {getExhibitBadge(q.questionText)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-on-surface leading-snug line-clamp-2">
                          {q.questionText}
                        </p>
                        {!isCorrect && (
                          <p className="mt-2 text-xs text-secondary font-semibold">
                            Jawaban benar: {correctText}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Results CTA */}
              <button
                onClick={() => router.push(ROUTES.visitResult || "/visit-result")}
                className="w-full bg-primary-container text-on-primary py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-sm"
              >
                Lihat Ringkasan Kunjungan 📊
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Navigation Bottom */}
      {phase === "quiz" && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-container-max bg-surface/85 backdrop-blur-md px-edge-margin py-4 border-t border-outline-variant/30 flex gap-4 z-30">
          <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className={`flex-1 h-14 rounded-full font-bold transition-all text-sm ${
              currentIndex === 0
                ? "bg-surface-container-highest text-on-surface-variant/40 cursor-not-allowed"
                : "bg-surface-container-high text-on-surface active:scale-95"
            }`}
          >
            Kembali
          </button>
          <button
            onClick={handleNextStep}
            disabled={!selectedOption}
            className={`flex-[1.5] h-14 rounded-full font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm ${
              !selectedOption
                ? "bg-primary-container/40 text-on-primary/60 cursor-not-allowed"
                : "bg-primary-container text-on-primary active:scale-95"
            }`}
          >
            {currentIndex === questions.length - 1 ? "Selesai" : "Selanjutnya"}
            <ArrowRightIcon />
          </button>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-edge-margin">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowExitModal(false)}
            />

            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1.05 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl p-8 w-full max-w-[340px] text-center shadow-2xl z-10"
            >
              <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-error" />
              </div>
              <h3 className="font-plus-jakarta-sans text-lg font-bold text-on-surface mb-3">
                Batalkan Kuis?
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                Progres kuis kamu tidak akan tersimpan jika kamu keluar sekarang.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push(ROUTES.home)}
                  className="w-full bg-error text-on-error py-4 rounded-full font-bold active:scale-95 transition-all text-sm"
                >
                  Ya, Keluar Saja
                </button>
                <button
                  onClick={() => setShowExitModal(false)}
                  className="w-full bg-surface-container-highest text-on-surface py-4 rounded-full font-bold active:scale-95 transition-all text-sm"
                >
                  Lanjutkan Kuis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Komponen SVG Panah ke Kanan Sederhana untuk Tombol Navigasi
function ArrowRightIcon() {
  return (
    <svg
      className="w-4 h-4 text-current"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
    </svg>
  );
}
