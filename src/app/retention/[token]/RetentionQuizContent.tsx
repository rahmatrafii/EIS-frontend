// src/app/retention/[token]/RetentionQuizContent.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

import { MobileShell } from "@/components/layout/visitor/MobileShell";
import { fetchRetentionQuiz, submitRetentionQuiz } from "@/services/quiz.service";
import { getUserProfile } from "@/services/auth.service";
import { PageTransition } from "@/components/layout/PageTransition";
import { ROUTES } from "@/constants/routes";
import { PageLoader } from "@/components/ui/PageLoader";

import type { Quiz, Question } from "@/types/quiz.types";

interface RetentionQuizContentProps {
  token: string;
}

interface UserAnswerCorrection {
  questionId: number;
  chosenOption: string;
  isCorrect: boolean;
  correctOption: string;
}

export function RetentionQuizContent({ token }: RetentionQuizContentProps) {
  const router = useRouter();

  // API State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [username, setUsername] = useState<string>("Penjelajah");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Errors State
  const [errorType, setErrorType] = useState<"EXPIRED" | "ALREADY_DONE" | "GENERIC" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Phase State: QUIZ (answering) or RESULT (review score)
  const [phase, setPhase] = useState<"QUIZ" | "RESULT">("QUIZ");

  // Interaction State
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitResult, setSubmitResult] = useState<{
    correctAnswers: number;
    totalQuestions: number;
    finalScore: number;
    corrections: UserAnswerCorrection[];
  } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorType(null);
    setErrorMsg(null);

    try {
      // 1. Fetch user profile in parallel (if logged in, grab name for greeting)
      getUserProfile().then((res) => {
        if (res.success && res.data?.name) {
          setUsername(res.data.name.split(" ")[0]);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      }).catch(() => {
        setIsLoggedIn(false);
      });

      // 2. Fetch quiz details via public token
      const res = await fetchRetentionQuiz(token);
      if (res.success) {
        setQuiz(res.data);
      } else {
        const err = res.error;
        if (err.statusCode === 400 && err.code === "RETENTION_EXPIRED") {
          setErrorType("EXPIRED");
        } else if (err.statusCode === 409 && err.code === "RETENTION_ALREADY_DONE") {
          setErrorType("ALREADY_DONE");
        } else {
          setErrorType("GENERIC");
          setErrorMsg(err.message || "Gagal memuat kuis retensi.");
        }
      }
    } catch (err) {
      console.error("Gagal memuat data kuis retensi:", err);
      setErrorType("GENERIC");
      setErrorMsg("Koneksi internet bermasalah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Option Click
  const handleSelectOption = (questionId: number, optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!quiz) return;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quiz.questions.length) return;

    setIsSubmitting(true);
    try {
      const payload = quiz.questions.map((q) => ({
        questionId: q.id,
        chosenOption: answers[q.id],
      }));

      const res = await submitRetentionQuiz(token, payload);
      if (res.success) {
        // Backend returns: { attempt: UserQuizAttempt, answers: correctionDetails[] }
        const { attempt, answers: corrections } = res.data;
        setSubmitResult({
          correctAnswers: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions,
          finalScore: attempt.finalScore,
          corrections: corrections || [],
        });
        setPhase("RESULT");
      } else {
        setErrorType("GENERIC");
        setErrorMsg(res.error.message || "Gagal mengirimkan kuis retensi.");
      }
    } catch (err) {
      console.error("Gagal mengirim kuis retensi:", err);
      setErrorType("GENERIC");
      setErrorMsg("Koneksi internet bermasalah. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom keyframes styling injected locally for 100% resemblance
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes wave {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-15deg); }
        75% { transform: rotate(15deg); }
      }
      .animate-wave {
        animation: wave 1.5s ease-in-out infinite;
        transform-origin: 70% 70%;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fadeIn 0.4s ease-out forwards;
      }
      .pb-safe {
        padding-bottom: env(safe-area-inset-bottom, 16px);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Loading indicator
  if (isLoading) {
    return <PageLoader text="Menyiapkan kuis retensimu..." minHeight="min-h-screen" />;
  }

  // Error state: Expired or Invalid Link
  if (errorType === "EXPIRED") {
    return (
      <MobileShell>
        <PageTransition className="flex-1 flex flex-col justify-center items-center bg-[#f8f9fa] p-6 text-center select-none min-h-screen">
          <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm">
            ❌
          </div>
          <h2 className="font-plus-jakarta-sans text-[20px] font-bold text-on-surface mb-2">
            Link Kuis Tidak Valid
          </h2>
          <p className="font-inter text-[14px] text-on-surface-variant mb-8 max-w-[280px] leading-relaxed">
            Link kuis retensi ini tidak valid atau sudah kadaluarsa (melebihi batas waktu aktif 24 jam).
          </p>
          <button
            onClick={() => router.push(isLoggedIn ? ROUTES.profile : ROUTES.welcome)}
            className="w-full max-w-[280px] h-12 bg-primary text-on-primary font-plus-jakarta-sans text-[14px] font-bold tracking-wider uppercase rounded-full shadow-md active:scale-95 transition-transform cursor-pointer"
          >
            {isLoggedIn ? "Kembali ke Profil" : "Kembali ke Beranda"}
          </button>
        </PageTransition>
      </MobileShell>
    );
  }

  // Error state: Already Answered
  if (errorType === "ALREADY_DONE") {
    return (
      <MobileShell>
        <PageTransition className="flex-1 flex flex-col justify-center items-center bg-[#f8f9fa] p-6 text-center select-none min-h-screen">
          <div className="w-20 h-20 bg-[#0051d5]/10 text-[#0051d5] rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm">
            💡
          </div>
          <h2 className="font-plus-jakarta-sans text-[20px] font-bold text-on-surface mb-2">
            Kuis Sudah Dikerjakan
          </h2>
          <p className="font-inter text-[14px] text-on-surface-variant mb-8 max-w-[280px] leading-relaxed">
            Anda sudah pernah menyelesaikan kuis retensi ini sebelumnya. Terima kasih atas partisipasi Anda!
          </p>
          <button
            onClick={() => router.push(isLoggedIn ? "/profile/retention-status" : ROUTES.welcome)}
            className="w-full max-w-[280px] h-12 bg-primary text-on-primary font-plus-jakarta-sans text-[14px] font-bold tracking-wider uppercase rounded-full shadow-md active:scale-95 transition-transform cursor-pointer"
          >
            {isLoggedIn ? "Lihat Status Retensi" : "Kembali ke Beranda"}
          </button>
        </PageTransition>
      </MobileShell>
    );
  }

  // Error state: Generic network or internal errors
  if (errorType === "GENERIC") {
    return (
      <MobileShell>
        <PageTransition className="flex-1 flex flex-col justify-center items-center bg-[#f8f9fa] p-6 text-center select-none min-h-screen">
          <div className="p-4 bg-error-container/40 rounded-full mb-4">
            <RefreshCw className="h-8 w-8 text-error animate-pulse" />
          </div>
          <h3 className="font-plus-jakarta-sans text-[18px] font-bold text-on-surface mb-2">
            Gagal Memuat Kuis
          </h3>
          <p className="font-inter text-sm text-on-surface-variant mb-6 max-w-[280px]">
            {errorMsg}
          </p>
          <button
            onClick={loadData}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-plus-jakarta-sans text-sm font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            Coba Lagi
          </button>
        </PageTransition>
      </MobileShell>
    );
  }

  if (!quiz) return null;

  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);

  // Identify type header kuis based on database quizType
  const badgeLabel = quiz.quizType === "RETENTION_1W" ? "KUIS H+7" : "KUIS H+30";

  return (
    <MobileShell>
      <PageTransition className="flex-1 flex flex-col bg-[#f8f9fa] select-none text-[#191c1d] min-h-screen relative">
        <main className="flex-1 overflow-y-auto pb-[180px] scroll-smooth">
          {phase === "QUIZ" ? (
            <div className="animate-fade-in">
              {/* Header Section */}
              <header className="bg-gradient-to-br from-[#316bf3] to-[#0051d5] pt-12 pb-8 px-5 rounded-b-[32px] shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] bg-[size:20px_20px]"></div>
                <div className="relative z-10 flex flex-col items-center text-center space-y-4 text-white">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-3xl">
                    📧
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-plus-jakarta-sans text-[12px] font-bold border border-white/30">
                    {badgeLabel}
                  </span>
                  <h1 className="font-plus-jakarta-sans text-[28px] font-extrabold leading-[36px] tracking-tight">
                    Halo, {username}! <span className="inline-block animate-wave">👋</span>
                  </h1>
                  <p className="font-inter text-[14px] text-white/80 max-w-[280px] leading-[20px]">
                    Mari uji seberapa banyak kamu mengingat hal menarik dari kunjunganmu.
                  </p>
                </div>
              </header>

              {/* Info Bar */}
              <section className="mx-5 -mt-6 relative z-20">
                <div className="bg-white rounded-2xl shadow-md p-4 flex justify-between items-center border border-[#e1e3e4]">
                  <div className="flex items-center space-x-1.5 font-plus-jakarta-sans text-[13px] font-bold text-[#3f493f]">
                    <span>📝</span>
                    <span>{totalQuestions} Soal</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-[#becabc]"></div>
                  <div className="flex items-center space-x-1.5 font-plus-jakarta-sans text-[13px] font-bold text-[#3f493f]">
                    <span>🐅</span>
                    <span>Multi Satwa</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-[#becabc]"></div>
                  <div className="flex items-center space-x-1.5 font-plus-jakarta-sans text-[13px] font-bold text-[#3f493f]">
                    <span>⏰</span>
                    <span>~{totalQuestions * 1.5} menit</span>
                  </div>
                </div>
              </section>

              {/* Tips / Instructions */}
              <section className="px-5 mt-6">
                <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-4 flex items-start space-x-3">
                  <span className="text-[#f59e0b] mt-0.5">💡</span>
                  <p className="font-inter text-[13px] text-[#3f493f] leading-[18px]">
                    Jawab semua soal di bawah, lalu klik tombol Submit di bagian bawah halaman.
                  </p>
                </div>
              </section>

              {/* Questions List */}
              <section className="px-5 mt-6 space-y-6 pb-6">
                {quiz.questions.map((question: Question, qIdx: number) => {
                  const selectedOption = answers[question.id];

                  // Setup options array dynamically filtering empty values
                  const questionOptions = [
                    { key: "A", text: question.optionA },
                    { key: "B", text: question.optionB },
                    { key: "C", text: question.optionC },
                    { key: "D", text: question.optionD },
                  ].filter((o) => !!o.text);

                  return (
                    <div
                      key={question.id}
                      className="bg-white rounded-[24px] shadow-sm border border-[#e1e3e4] p-5 flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#dbe1ff] text-[#00174b] font-plus-jakarta-sans text-[11px] font-bold">
                          Kuis Retensi
                        </span>
                        <span className="font-plus-jakarta-sans text-[13px] font-bold text-[#3f493f]">
                          Soal {qIdx + 1}
                        </span>
                      </div>
                      <h3 className="font-plus-jakarta-sans text-[18px] font-bold text-[#191c1d] mb-5 leading-[24px]">
                        {question.questionText}
                      </h3>

                      <div className="space-y-3">
                        {questionOptions.map((opt) => {
                          const isSelected = selectedOption === opt.key;
                          return (
                            <button
                              key={opt.key}
                              onClick={() => handleSelectOption(question.id, opt.key)}
                              className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center space-x-4 cursor-pointer select-none ${
                                isSelected
                                  ? "bg-[#0051d5]/10 border-[#0051d5]"
                                  : "bg-white border-[#e1e3e4] hover:bg-[#f3f4f5]"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full border flex items-center justify-center font-plus-jakarta-sans text-[14px] font-bold transition-colors ${
                                  isSelected
                                    ? "bg-[#0051d5] border-[#0051d5] text-white"
                                    : "border-[#becabc] text-[#3f493f]"
                                }`}
                              >
                                {opt.key}
                              </div>
                              <span
                                className={`font-inter text-[14px] text-[#191c1d] leading-[20px] ${
                                  isSelected ? "font-semibold text-[#0051d5]" : ""
                                }`}
                              >
                                {opt.text}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Result Success Header */}
              <header className="bg-gradient-to-br from-[#15803d] to-[#00652c] pt-12 pb-16 px-5 rounded-b-[32px] shadow-sm relative overflow-hidden text-center text-white">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] bg-[size:20px_20px]"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center text-4xl shadow-lg mb-6 transform -rotate-12 select-none">
                    🏆
                  </div>
                  <p className="font-plus-jakarta-sans text-[12px] font-bold text-[#95f8a7] mb-2 uppercase tracking-wider">
                    Hasil Kuis Retensi
                  </p>
                  <h2 className="font-plus-jakarta-sans text-[32px] font-extrabold leading-[40px] mb-2">
                    {submitResult?.correctAnswers} dari {submitResult?.totalQuestions} Benar
                  </h2>
                  <p className="font-inter text-[15px] text-white/90 max-w-[280px] mx-auto leading-[22px]">
                    {submitResult && submitResult.finalScore === 100
                      ? "Luar biasa! Ingatanmu setajam Harimau Sumatera! 🐅"
                      : "Kerja bagus! Terus asah ingatanmu tentang fauna! 🐘"}
                  </p>
                </div>
              </header>

              {/* Review Section */}
              <section className="px-5 -mt-8 relative z-20 space-y-4">
                {quiz.questions.map((question: Question, qIdx: number) => {
                  const correction = submitResult?.corrections.find((c) => c.questionId === question.id);
                  const isCorrect = correction ? correction.isCorrect : false;
                  const correctOption = correction ? correction.correctOption : "A";

                  // Match option text
                  const chosenText =
                    question[`option${answers[question.id]}` as keyof Question] || answers[question.id];
                  const correctText = question[`option${correctOption}` as keyof Question] || correctOption;

                  return (
                    <div
                      key={question.id}
                      className="bg-white rounded-[24px] shadow-md border border-[#e1e3e4] p-5 flex flex-col"
                    >
                      <div className="flex items-start space-x-3 mb-3">
                        <span
                          className={`mt-1 material-symbols-outlined text-[24px] shrink-0 font-bold select-none ${
                            isCorrect ? "text-[#22c55e]" : "text-error"
                          }`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {isCorrect ? "check_circle" : "cancel"}
                        </span>
                        <div>
                          <h4 className="font-plus-jakarta-sans text-[16px] font-bold text-[#191c1d] leading-[22px]">
                            {question.questionText}
                          </h4>
                        </div>
                      </div>

                      <div className="ml-9 flex flex-col gap-2.5">
                        <div
                          className={`p-3 rounded-xl border font-inter text-[13px] leading-[18px] ${
                            isCorrect
                              ? "bg-[#22c55e]/10 border-[#22c55e]/20 text-[#191c1d]"
                              : "bg-error-container/40 border-error-container text-[#ba1a1a]"
                          }`}
                        >
                          <span className="font-bold">{isCorrect ? "Jawabanmu: " : "Jawabanmu: "}</span>
                          {chosenText as string}
                        </div>

                        {!isCorrect && (
                          <div className="p-3 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl text-[#00652c] font-inter text-[13px] leading-[18px]">
                            <span className="font-bold">Jawaban Benar: </span>
                            {correctText as string}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* Action Footer */}
              <section className="px-5 mt-8 space-y-4 pb-12">
                {isLoggedIn ? (
                  <>
                    <div className="bg-[#b4c5ff]/20 rounded-xl p-4 text-center border border-[#b4c5ff]/30 text-on-surface-variant">
                      <p className="font-inter text-[13px] leading-[18px]">
                        Hasil skor retensi ini telah masuk ke dalam rekapan EIS (Educational Impact Score) Anda untuk
                        rekomendasi rute!
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(ROUTES.profile)}
                      className="w-full h-12 bg-[#0051d5] hover:bg-[#0051d5]/90 text-white font-plus-jakarta-sans text-[16px] font-bold rounded-full active:scale-[0.97] transition-all cursor-pointer shadow-md select-none text-center"
                    >
                      Tutup & Lihat Profil
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-[#f59e0b]/10 rounded-xl p-4 text-center border border-[#f59e0b]/30 text-on-surface-variant">
                      <p className="font-inter text-[13px] leading-[18px] text-[#3f493f]">
                        💡 <strong>Sesi Belum Terhubung:</strong> Anda mengerjakan kuis ini di browser yang belum masuk. Skor Anda sudah disimpan, silakan masuk ke akun Anda untuk melihat statistik EIS lengkap.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => router.push(ROUTES.login)}
                        className="w-full h-12 bg-[#0051d5] hover:bg-[#0051d5]/90 text-white font-plus-jakarta-sans text-[16px] font-bold rounded-full active:scale-[0.97] transition-all cursor-pointer shadow-md select-none text-center"
                      >
                        Masuk ke Akun Anda
                      </button>
                      <button
                        onClick={() => router.push(ROUTES.welcome)}
                        className="w-full h-12 bg-white border border-[#e1e3e4] hover:bg-[#f3f4f5] text-[#3f493f] font-plus-jakarta-sans text-[16px] font-bold rounded-full active:scale-[0.97] transition-all cursor-pointer shadow-md select-none text-center"
                      >
                        Kembali ke Beranda
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </main>

        {/* Sticky Progress Footer */}
        {phase === "QUIZ" && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] md:max-w-[850px] lg:max-w-[960px] bg-white/85 backdrop-blur-lg border-t border-slate-200/60 px-6 py-5 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-40 pb-safe flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="font-plus-jakarta-sans text-[13px] font-bold text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                {answeredCount} dari {totalQuestions} Soal Dijawab
              </span>
              <span className="font-plus-jakarta-sans text-[14px] font-extrabold text-[#0051d5]">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4 border border-slate-200/20">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-[#0051d5] rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,81,213,0.3)]"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={answeredCount < totalQuestions || isSubmitting}
              className={`w-full h-12 font-plus-jakarta-sans text-[16px] font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 tracking-wide ${
                answeredCount === totalQuestions
                  ? "bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white hover:shadow-[0_4px_14px_rgba(16,185,129,0.35)] active:scale-[0.98] cursor-pointer"
                  : "bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed"
              }`}
            >
              <span>Submit Jawaban</span>
              {isSubmitting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin text-white" />
              ) : answeredCount === totalQuestions ? (
                <span className="text-[18px]">🚀</span>
              ) : null}
            </button>
          </div>
        )}
      </PageTransition>
    </MobileShell>
  );
}
