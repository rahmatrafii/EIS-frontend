"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, ArrowRight, RefreshCw, Trophy, Sparkles, Compass } from "lucide-react";

import { useSession } from "@/hooks/useSession";
import { useQuiz } from "@/hooks/useQuiz";
import { getQuizResult } from "@/services/quiz.service";
import { ROUTES } from "@/constants/routes";
import { QuizProgress } from "@/components/visitor/QuizProgress";
import { QuizOption } from "@/components/visitor/QuizOption";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { PageLoader } from "@/components/ui/PageLoader";

// Peta jawaban benar statis untuk kuis yang diseed di database backend.
// Ini digunakan untuk menampilkan review detail jawaban benar/salah pada Phase 2 (Result UI).
const CORRECT_OPTIONS_MAP: Record<number, "A" | "B" | "C" | "D"> = {
  1: "A", // Apa makanan utama dari Singa? -> Daging
  2: "C", // Komodo adalah hewan endemik asli dari negara mana? -> Indonesia
  3: "A", // Apakah Singa hidup berkelompok (pride)? -> Ya, berkelompok
  4: "B", // Berapa panjang maksimal seekor Komodo dewasa? -> 3 meter
  5: "B", // Apa fungsi rambut tebal di leher Singa jantan? -> Melindungi leher...
  6: "C", // Bagaimana cara Komodo mendeteksi keberadaan mangsanya...? -> Menggunakan lidah...
  7: "A", // Apa nama ilmiah (latin) dari Singa? -> Panthera leo
};


export function PreZooContent() {
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
  } = useQuiz("PRE_ZOO");

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");

  // Inisialisasi sesi kunjungan di awal load halaman
  useEffect(() => {
    async function start() {
      const sId = await initializeSession({ createIfMissing: true });
      if (sId) {
        setActiveSessionId(sId);
        // Cek apakah user sudah pernah menyelesaikan kuis pre-test di sesi aktif ini
        const checkResult = await getQuizResult(sId);
        if (checkResult.success && checkResult.data.hasPreZoo) {
          router.replace(ROUTES.home);
        } else {
          loadQuiz(sId);
        }
      }
    }
    start();
  }, [initializeSession, loadQuiz, router]);

  const activeError = sessionError || quizError;
  const isLoading = isSessionLoading || isQuizLoading;


  // Tagline & Keterangan motivasi berdasarkan skor hasil kuis awal
  const scoreFeedback = useMemo(() => {
    if (!submittedResult) return { tagline: "Hebat!", desc: "Kamu siap untuk petualangan ini!" };
    const score = submittedResult.finalScore;
    if (score >= 80) {
      return {
        tagline: "Luar Biasa!",
        desc: "Pengetahuanmu tentang satwa liar sangat mengesankan. Kamu siap untuk petualangan ini!",
      };
    } else if (score >= 50) {
      return {
        tagline: "Hebat sekali!",
        desc: "Kamu memiliki pemahaman yang baik tentang satwa. Mari belajar lebih banyak selama petualangan!",
      };
    } else {
      return {
        tagline: "Ayo Petualangan!",
        desc: "Jangan khawatir! Kunjungan hari ini akan membantumu mengenal satwa-satwa luar biasa ini lebih dekat.",
      };
    }
  }, [submittedResult]);

  // Handler interaksi tombol "Selanjutnya / Selesai"
  async function handleNextStep() {
    if (!currentQuestion || !activeSessionId) return;

    const hasSelected = answers[currentQuestion.id] !== undefined;
    if (!hasSelected) return;

    const isLastQuestion = quiz && currentIndex === quiz.questions.length - 1;

    if (isLastQuestion) {
      const result = await submitAnswers(activeSessionId);
      if (result) {
        setPhase("result");
      }
    } else {
      nextQuestion();
    }
  }

  // Batal kuis / Tutup halaman kuis awal
  function handleClose() {
    router.push(ROUTES.welcome);
  }

  // Arahkan pengunjung ke dashboard /home
  function handleStartAdventure() {
    router.push(ROUTES.home);
  }

  // State: Loading
  if (isLoading) {
    return <PageLoader text="Menyiapkan kuis untuk Anda..." minHeight="min-h-screen" />;
  }

  // State: Error
  if (activeError) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-background p-6 text-center">
        <div className="p-4 bg-error-container/40 rounded-full mb-4">
          <RefreshCw className="h-8 w-8 text-error" />
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
            const sId = await initializeSession({ createIfMissing: true });
            if (sId) {
              setActiveSessionId(sId);
              loadQuiz(sId);
            }
          }}
          className="bg-primary text-on-primary px-6"
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  if (!quiz || !currentQuestion) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-background p-6">
        <p className="font-inter text-sm text-on-surface-variant">Soal kuis tidak tersedia.</p>
      </div>
    );
  }

  const selectedOption = answers[currentQuestion.id];
  const hasSelected = selectedOption !== undefined;
  const isLastQuestion = currentIndex === quiz.questions.length - 1;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fbfdfa] relative overflow-hidden select-none">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#7cf994]/8 blur-3xl z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />

      <AnimatePresence mode="wait">
        {phase === "quiz" ? (
          <motion.div
            key="quiz-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full w-full relative z-10"
          >
            {/* Sticky Header */}
            <header className="w-full bg-[#fbfdfa]/80 backdrop-blur-md pt-6 pb-4 px-edge-margin sticky top-0 z-20 flex flex-col gap-4 border-b border-outline-variant/10">
              <div className="flex justify-between items-center w-full relative h-10">
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-white border border-outline-variant/20 flex items-center justify-center text-on-surface hover:bg-surface-variant/20 active:scale-95 transition-all cursor-pointer shadow-xs"
                  aria-label="Tutup kuis"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex flex-col items-center select-none absolute left-1/2 -translate-x-1/2">
                  <span className="block text-[9px] uppercase tracking-[0.2em] text-primary font-bold">
                    Persiapan Petualangan
                  </span>
                  <h1 className="font-plus-jakarta-sans font-bold text-[18px] text-on-surface">
                    Kuis Awal
                  </h1>
                </div>
                <div className="w-10 h-10" />
              </div>
              <QuizProgress current={currentIndex + 1} total={quiz.questions.length} />
            </header>

            {/* Main Content Area (Scrollable Question + Options) */}
            <main className="flex-1 overflow-y-auto px-edge-margin pt-6 pb-32 relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-6"
                >
                  {/* Pertanyaan wrapped in a beautiful glass card */}
                  <div className="bg-white/50 backdrop-blur-md border border-outline-variant/20 rounded-2xl p-6 shadow-xs relative overflow-hidden z-10">
                    <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
                      <Compass className="h-24 w-24 text-primary" />
                    </div>
                    <h2 className="font-plus-jakarta-sans text-[18px] md:text-[22px] font-bold text-on-surface leading-[1.4] relative z-10">
                      {currentQuestion.questionText}
                    </h2>
                  </div>

                  {/* Grid Pilihan Jawaban */}
                  <div className="flex flex-col gap-3">
                    <QuizOption
                      label="A"
                      text={currentQuestion.optionA}
                      isSelected={selectedOption === "A"}
                      onSelect={() => selectAnswer(currentQuestion.id, "A")}
                    />
                    <QuizOption
                      label="B"
                      text={currentQuestion.optionB}
                      isSelected={selectedOption === "B"}
                      onSelect={() => selectAnswer(currentQuestion.id, "B")}
                    />
                    <QuizOption
                      label="C"
                      text={currentQuestion.optionC}
                      isSelected={selectedOption === "C"}
                      onSelect={() => selectAnswer(currentQuestion.id, "C")}
                    />
                    <QuizOption
                      label="D"
                      text={currentQuestion.optionD}
                      isSelected={selectedOption === "D"}
                      onSelect={() => selectAnswer(currentQuestion.id, "D")}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Sticky Bottom Navigation Bar */}
            <footer className="fixed bottom-0 left-0 right-0 w-full max-w-container-max mx-auto bg-[#fbfdfa]/85 backdrop-blur-md border-t border-outline-variant/10 p-edge-margin pb-8 sm:pb-edge-margin flex gap-4 z-20">
              {currentIndex > 0 && (
                <Button
                  variant="secondary"
                  onClick={prevQuestion}
                  className="flex-1 py-3.5 rounded-full font-plus-jakarta-sans text-[16px] font-semibold flex items-center justify-center gap-2 hover:bg-surface-variant/50 transition-all active:scale-[0.98] border border-outline-variant/10 shadow-xs"
                >
                  Kembali
                </Button>
              )}
              <Button
                onClick={handleNextStep}
                disabled={!hasSelected || isSubmitting}
                className={cn(
                  "py-3.5 rounded-full bg-primary text-on-primary font-plus-jakarta-sans text-[16px] font-semibold flex items-center justify-center gap-2 hover:bg-primary/95 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none",
                  currentIndex > 0 ? "flex-[1.5]" : "w-full"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isLastQuestion ? (
                  <>
                    Selesai & Lihat Hasil
                    <ArrowRight className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    Selanjutnya
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="result-phase"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col h-full w-full bg-[#fbfdfa]"
          >
            {/* Scrollable Result Content */}
            <main className="flex-1 overflow-y-auto pb-32 flex flex-col items-center relative">
              {/* Result Hero Banner (Lush Green Forest Theme) */}
              <section className="w-full bg-gradient-to-br from-primary via-on-primary-fixed-variant to-[#002f12] text-on-primary py-12 px-edge-margin relative overflow-hidden flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.06)] rounded-b-[2.5rem]">
                {/* Glow Effect */}
                <div
                  aria-hidden="true"
                  className="absolute w-72 h-72 rounded-full bg-[#95f8a7]/15 blur-3xl z-0 pointer-events-none"
                ></div>

                <div className="z-10 relative flex flex-col items-center gap-4 w-full">
                  {/* Trophy Badge */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
                    className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg relative"
                  >
                    <Trophy className="h-10 w-10 text-[#7cf994]" />
                    <Sparkles className="h-4 w-4 text-[#7cf994] absolute top-1.5 right-1.5 animate-pulse" />
                  </motion.div>

                  {/* Score Typography */}
                  <div className="flex flex-col gap-1.5 select-none">
                    <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-[#95f8a7] font-bold">
                      Hasil Kuis Awal
                    </span>
                    <h2 className="font-plus-jakarta-sans text-[48px] font-extrabold text-on-primary leading-none tracking-tight">
                      {submittedResult?.correctAnswers ?? 0}
                      <span className="text-[28px] font-normal text-on-primary/60">
                        {" "}/ {submittedResult?.totalQuestions ?? quiz.questions.length}
                      </span>
                    </h2>
                    <p className="font-plus-jakarta-sans text-[20px] font-bold text-on-primary mt-2">
                      {scoreFeedback.tagline}
                    </p>
                    <p className="font-inter text-[13px] md:text-[14px] leading-[1.6] text-on-primary/85 max-w-[320px] mx-auto mt-1 px-4">
                      {scoreFeedback.desc}
                    </p>
                  </div>
                </div>
              </section>

              {/* Summary List */}
              <div className="w-full flex flex-col gap-3 px-edge-margin mt-8 fade-in-up" style={{ animationDelay: "0.1s" }}>
                <h3 className="font-plus-jakarta-sans text-[11px] font-bold text-outline tracking-widest mb-1 uppercase select-none">
                  Ringkasan Jawaban
                </h3>

                {quiz.questions.map((question) => {
                  const userAnswer = answers[question.id];
                  const serverAns = submittedResult?.answers?.find((ans) => ans.questionId === question.id);
                  const correctOption = serverAns?.correctOption || CORRECT_OPTIONS_MAP[question.id] || "A";
                  const isCorrect = serverAns ? serverAns.isCorrect : (userAnswer === correctOption);

                  // Ambil teks untuk jawaban user & jawaban benar
                  const getUserAnswerText = () => {
                    if (userAnswer === "A") return question.optionA;
                    if (userAnswer === "B") return question.optionB;
                    if (userAnswer === "C") return question.optionC;
                    if (userAnswer === "D") return question.optionD;
                    return "";
                  };

                  const getCorrectAnswerText = () => {
                    if (correctOption === "A") return question.optionA;
                    if (correctOption === "B") return question.optionB;
                    if (correctOption === "C") return question.optionC;
                    if (correctOption === "D") return question.optionD;
                    return "";
                  };

                  return (
                    <div
                      key={question.id}
                      className={cn(
                        "bg-white rounded-2xl p-4 flex gap-4 items-start shadow-xs border transition-all duration-300",
                        isCorrect
                          ? "border-secondary-container/20 hover:border-secondary-container/40"
                          : "bg-[#fffafa] border-error-container/20"
                      )}
                    >
                      {isCorrect ? (
                        <div className="w-8 h-8 rounded-full bg-[#7cf994]/15 border border-[#7cf994]/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-[18px] w-[18px] text-[#007230] font-extrabold" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-error-container/20 border border-error-container/30 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="h-[18px] w-[18px] text-error font-extrabold" />
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5 w-full">
                        <p className="font-inter text-[13px] text-on-surface-variant leading-snug line-clamp-2">
                          {question.questionText}
                        </p>
                        {isCorrect ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-primary text-[10px] px-1.5 py-0.5 rounded bg-primary/10 font-bold">Kamu</span>
                            <p className="font-plus-jakarta-sans text-sm font-semibold text-primary">
                              {getUserAnswerText()}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-error text-[10px] px-1.5 py-0.5 rounded bg-error/10 font-bold">Kamu</span>
                              <p className="font-plus-jakarta-sans text-sm font-semibold text-error/85 line-through decoration-2">
                                {getUserAnswerText() || "Belum Dijawab"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-primary text-[10px] px-1.5 py-0.5 rounded bg-primary/10 font-bold">Kunci</span>
                              <p className="font-inter text-[12px] text-primary font-medium">
                                {getCorrectAnswerText()}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>

            {/* Final CTA Button */}
            <div className="fixed bottom-0 left-0 right-0 w-full max-w-container-max mx-auto bg-[#fbfdfa]/85 backdrop-blur-md p-edge-margin pb-8 sm:pb-edge-margin z-40 border-t border-outline-variant/10">
              <button
                onClick={handleStartAdventure}
                className="w-full py-3.5 rounded-full bg-primary text-on-primary font-plus-jakarta-sans text-[16px] font-semibold flex items-center justify-center gap-2 hover:bg-primary/95 shadow-md active:scale-[0.98] cursor-pointer"
              >
                Mulai Jelajahi Kebun Binatang
                <Compass className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
