import { apiRequest } from "./api";
import { API } from "@/constants/api-endpoints";
import type { Quiz, QuizSubmitPayload, QuizAttemptResult, QuizResultComparison, RetentionStatus } from "@/types/quiz.types";
import type { ApiResult } from "@/types/api.types";

export async function fetchQuiz(
  type: string,
  sessionId: string | number
): Promise<ApiResult<Quiz>> {
  // GET /quizzes/fetch?type={type}&session_id={sessionId}
  // Catatan: Sesuai quizzes.validator.js backend, query param menggunakan sessionId (camelCase)
  return apiRequest<Quiz>(`${API.quizzes.fetch}?type=${type}&sessionId=${sessionId}`);
}

export async function submitQuiz(
  payload: QuizSubmitPayload
): Promise<ApiResult<QuizAttemptResult>> {
  // POST /quizzes/submit
  return apiRequest<QuizAttemptResult>(API.quizzes.submit, {
    method: "POST",
    body: {
      sessionId: payload.sessionId,
      quizId: payload.quizId,
      answers: payload.answers.map((ans) => ({
        questionId: ans.questionId,
        chosenOption: ans.chosenOption,
      })),
    },
  });
}

export async function getQuizResult(
  sessionId: string | number
): Promise<ApiResult<QuizResultComparison>> {
  // GET /quizzes/result/{sessionId}
  return apiRequest<QuizResultComparison>(API.quizzes.result(sessionId.toString()));
}

export async function getRetentionStatus(): Promise<ApiResult<RetentionStatus>> {
  // GET /quizzes/retention-status
  const res = await apiRequest<any[]>(API.quizzes.retentionStatus);
  if (!res.success) {
    return res;
  }

  const schedules = res.data || [];

  // Find schedules by their quiz types (latest first)
  const h7Schedule = [...schedules].reverse().find((s: any) => s.quizType === "RETENTION_1W");
  const h30Schedule = [...schedules].reverse().find((s: any) => s.quizType === "RETENTION_1M");

  const mapScheduleDetail = (
    schedule: any,
    fallbackStatus: "PENDING" | "LOCKED",
    fallbackOffsetDays: number
  ) => {
    if (!schedule) {
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + fallbackOffsetDays);
      return {
        status: fallbackStatus,
        sentAt: null,
        completedAt: null,
        expiresAt: fallbackDate.toISOString(),
        token: null,
        score: null,
      };
    }

    return {
      status: schedule.status,
      sentAt: schedule.sentAt || null,
      completedAt: schedule.status === "COMPLETED" ? (schedule.sentAt || new Date().toISOString()) : null,
      expiresAt: schedule.scheduledAt,
      token: schedule.token || null,
      score: schedule.score !== undefined && schedule.score !== null ? schedule.score : null,
    };
  };

  const mappedStatus: RetentionStatus = {
    h7: mapScheduleDetail(h7Schedule, "PENDING", 7),
    h30: mapScheduleDetail(h30Schedule, "LOCKED", 30),
    schedules: schedules.map((s: any) => ({
      id: s.id,
      userId: s.userId,
      sessionId: s.sessionId,
      quizType: s.quizType,
      status: s.status,
      sentAt: s.sentAt || null,
      completedAt: s.status === "COMPLETED" ? (s.completedAt || s.sentAt || new Date().toISOString()) : null,
      scheduledAt: s.scheduledAt,
      expiresAt: s.status === "SENT" ? new Date(new Date(s.sentAt).getTime() + 24 * 60 * 60 * 1000).toISOString() : s.scheduledAt,
      token: s.token || null,
      score: s.score !== undefined && s.score !== null ? s.score : null,
    })),
  };

  return {
    success: true,
    data: mappedStatus,
  };
}

export async function fetchRetentionQuiz(token: string): Promise<ApiResult<Quiz>> {
  // GET /retention/quiz/{token}
  return apiRequest<Quiz>(API.retention.quiz(token), { isPublic: true });
}

export async function submitRetentionQuiz(
  token: string,
  answers: { questionId: number; chosenOption: string }[]
): Promise<ApiResult<any>> {
  // POST /retention/submit/{token}
  return apiRequest<any>(API.retention.submit(token), {
    method: "POST",
    body: { answers },
    isPublic: true,
  });
}

