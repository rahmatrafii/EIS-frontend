import { apiRequest } from "./api";
import { API } from "@/constants/api-endpoints";
import type { VisitSession } from "@/types/session.types";
import type { ApiResult } from "@/types/api.types";

function mapSession(s: any): VisitSession {
  if (!s) return s;
  const preAttempt = s.quizAttempts?.find((q: any) => q.quiz?.quizType === "PRE_ZOO");
  const postAttempt = s.quizAttempts?.find((q: any) => q.quiz?.quizType === "POST_ZOO");
  return {
    id: s.id,
    userId: s.userId,
    visitDate: s.visitDate,
    checkInAt: s.checkInAt,
    checkOutAt: s.checkOutAt,
    isCompleted: s.isCompleted,
    eisScore: s.eisScore?.finalEisScore ?? null,
    preScore: preAttempt ? preAttempt.finalScore : null,
    postScore: postAttempt ? postAttempt.finalScore : null,
    totalExhibitsVisited: s.eisScore?.totalExhibitsVisited ?? null,
  };
}

export async function startSession(): Promise<ApiResult<VisitSession>> {
  const res = await apiRequest<any>(API.sessions.start, {
    method: "POST",
  });
  if (!res.success) return res;
  return {
    success: true,
    data: mapSession(res.data),
  };
}

export async function getSessionHistory(): Promise<ApiResult<VisitSession[]>> {
  const res = await apiRequest<any[]>(API.sessions.history);
  if (!res.success) return res;
  return {
    success: true,
    data: (res.data || []).map(mapSession),
  };
}

export async function endSession(sessionId: number): Promise<ApiResult<VisitSession>> {
  const res = await apiRequest<any>(API.sessions.end, {
    method: "POST",
    body: { session_id: sessionId },
  });
  if (!res.success) return res;
  return {
    success: true,
    data: mapSession(res.data),
  };
}


