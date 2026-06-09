// src/services/analytics.service.ts
import { apiRequest } from "./api";
import { API } from "@/constants/api-endpoints";
import type { SessionAnalytics, EisScore } from "@/types/analytics.types";
import type { DashboardAnalytics } from "@/types/admin.types";
import type { ApiResult } from "@/types/api.types";

const getExhibitEmoji = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("harimau")) return "🐅";
  if (lower.includes("gajah")) return "🐘";
  if (lower.includes("singa")) return "🦁";
  if (lower.includes("jerapah")) return "🦒";
  if (lower.includes("orangutan")) return "🦧";
  if (lower.includes("burung") || lower.includes("aviary")) return "🦜";
  if (lower.includes("ular") || lower.includes("reptil")) return "🐍";
  if (lower.includes("buaya")) return "🐊";
  if (lower.includes("komodo")) return "🦎";
  return "🐯"; // Default fallback
};

export async function getSessionAnalytics(
  sessionId: string | number
): Promise<ApiResult<SessionAnalytics>> {
  // GET /analytics/session/{sessionId}
  const res = await apiRequest<any>(API.analytics.session(sessionId.toString()));
  if (!res.success) {
    return res;
  }

  const data = res.data;
  const exhibits = data?.exhibits || [];
  const quizResults = data?.quizResults || {};
  const preTest = quizResults.preTest || null;
  const postTest = quizResults.postTest || null;

  // Map exhibits to VisitedExhibitDetail format
  const visitedExhibits = exhibits.map((ex: any) => {
    let visitedAt = "09:00";
    if (ex.startTime) {
      try {
        const startTimeDate = new Date(ex.startTime);
        visitedAt = startTimeDate.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        });
      } catch (e) {
        console.error("Failed to parse exhibit startTime:", e);
      }
    }

    const durationSeconds = ex.durationSeconds || 0;
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

    return {
      id: ex.exhibitId,
      name: ex.exhibitName,
      zone: ex.zoneName,
      visitedAt,
      durationMinutes,
      emoji: getExhibitEmoji(ex.exhibitName),
      mediaClicked: {
        audio: !!ex.mediaClicked?.audio,
        video: !!ex.mediaClicked?.video,
        visual: !!ex.mediaClicked?.visual,
        interactive: !!ex.mediaClicked?.interactive,
      },
    };
  });

  // Calculate media engagement aggregates
  let audioCount = 0;
  let videoCount = 0;
  let infographicCount = 0;
  let labCount = 0;

  exhibits.forEach((ex: any) => {
    if (ex.mediaClicked?.audio) audioCount++;
    if (ex.mediaClicked?.video) videoCount++;
    if (ex.mediaClicked?.visual) infographicCount++;
    if (ex.mediaClicked?.interactive) labCount++;
  });

  const summary = data?.sessionSummary || {};

  const mappedAnalytics: SessionAnalytics = {
    sessionId: summary.sessionId || Number(sessionId),
    userId: summary.userId || 0,
    visitDate: summary.visitDate || new Date().toISOString(),
    checkInAt: summary.checkInAt || new Date().toISOString(),
    checkOutAt: summary.checkOutAt || null,
    isCompleted: !!summary.isCompleted,
    totalDurationSeconds: summary.totalDurationSeconds || 0,
    totalExhibitsVisited: summary.totalExhibitsVisited || 0,
    favoriteMedia: summary.favoriteMedia || null,
    preTestScore: preTest ? preTest.finalScore : 60, // Fallback to 60 as defined in UI
    postTestScore: postTest ? postTest.finalScore : null,
    knowledgeGain: (preTest && postTest) ? Math.max(0, postTest.finalScore - preTest.finalScore) : null,
    visitedExhibits,
    mediaEngagement: {
      audioCount,
      videoCount,
      infographicCount,
      labCount,
    },
  };

  return {
    success: true,
    data: mappedAnalytics,
  };
}

export async function getEisScore(
  userId: string | number
): Promise<ApiResult<EisScore>> {
  // GET /analytics/eis/{userId}
  return apiRequest<EisScore>(API.analytics.eis(userId.toString()));
}

// Admin Dashboard Analytics
export async function getDashboardAnalytics(params?: {
  date_from?: string;
  date_to?: string;
  age_category?: string;
}): Promise<ApiResult<DashboardAnalytics>> {
  let endpoint = API.analytics.dashboard;

  if (params) {
    const searchParams = new URLSearchParams();
    if (params.date_from) searchParams.set("date_from", params.date_from);
    if (params.date_to) searchParams.set("date_to", params.date_to);
    if (params.age_category && params.age_category !== "ALL" && params.age_category !== "SEMUA") searchParams.set("age_category", params.age_category);
    const qs = searchParams.toString();
    if (qs) endpoint += `?${qs}`;
  }

  return apiRequest<DashboardAnalytics>(endpoint);
}

export interface VisitorListItem {
  id: number;
  name: string;
  email: string;
  category: "CHILD" | "TEEN" | "ADULT";
  lastVisit: string | null;
  visits: number;
  eisScore: number;
  grade: "S" | "A" | "B" | "C" | "D";
}

export async function getVisitorList(params?: {
  date_from?: string;
  date_to?: string;
  age_category?: string;
}): Promise<ApiResult<VisitorListItem[]>> {
  let endpoint = API.analytics.visitors;

  if (params) {
    const searchParams = new URLSearchParams();
    if (params.date_from) searchParams.set("date_from", params.date_from);
    if (params.date_to) searchParams.set("date_to", params.date_to);
    if (params.age_category && params.age_category !== "ALL" && params.age_category !== "SEMUA") searchParams.set("age_category", params.age_category);
    const qs = searchParams.toString();
    if (qs) endpoint += `?${qs}`;
  }

  return apiRequest<VisitorListItem[]>(endpoint);
}

export interface ExhibitTrendPoint {
  name: string;
  visitors: number;
  interactions: number;
}

export async function getExhibitTrend(
  exhibitId: string | number
): Promise<ApiResult<ExhibitTrendPoint[]>> {
  return apiRequest<ExhibitTrendPoint[]>(API.analytics.exhibitTrend(exhibitId.toString()));
}

