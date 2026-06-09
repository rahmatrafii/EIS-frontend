"use client";

import { useState, useCallback } from "react";
import { fetchQuiz as fetchQuizApi, submitQuiz as submitQuizApi } from "@/services/quiz.service";
import type { Quiz, QuizAnswerPayload, QuizAttemptResult } from "@/types/quiz.types";

export function useQuiz(type: string) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<QuizAttemptResult | null>(null);

  const loadQuiz = useCallback(async (sessionId: number) => {
    setIsLoading(true);
    setError(null);
    const result = await fetchQuizApi(type, sessionId);
    setIsLoading(false);

    if (result.success) {
      setQuiz(result.data);
      setCurrentIndex(0);
      setAnswers({});
      setSubmittedResult(null);
    } else {
      setError(result.error.message);
    }
  }, [type]);

  const selectAnswer = useCallback((questionId: number, option: "A" | "B" | "C" | "D") => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  }, []);

  const nextQuestion = useCallback(() => {
    if (!quiz) return false;
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return true;
    }
    return false;
  }, [quiz, currentIndex]);

  const prevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      return true;
    }
    return false;
  }, [currentIndex]);


  const submitAnswers = useCallback(async (sessionId: number): Promise<QuizAttemptResult | null> => {
    if (!quiz) return null;
    
    setIsSubmitting(true);
    setError(null);

    const payloadAnswers: QuizAnswerPayload[] = Object.entries(answers).map(([qId, ans]) => ({
      questionId: parseInt(qId, 10),
      chosenOption: ans,
    }));

    const result = await submitQuizApi({
      quizId: quiz.id,
      sessionId,
      answers: payloadAnswers,
    });
    
    setIsSubmitting(false);

    if (result.success) {
      setSubmittedResult(result.data);
      return result.data;
    } else {
      setError(result.error.message);
      return null;
    }
  }, [quiz, answers]);

  const reset = useCallback(() => {
    setQuiz(null);
    setCurrentIndex(0);
    setAnswers({});
    setSubmittedResult(null);
    setError(null);
  }, []);

  return {
    quiz,
    currentIndex,
    currentQuestion: quiz?.questions[currentIndex] ?? null,
    answers,
    isLoading,
    isSubmitting,
    error,
    submittedResult,
    loadQuiz,
    selectAnswer,
    nextQuestion,
    prevQuestion,
    submitAnswers,
    reset,
  };
}
