// src/constants/api-endpoints.ts
export const API = {
  users: {
    register:   "/users/register",
    requestOtp: "/users/request-otp",
    verifyOtp:  "/users/verify-otp",
    profile:    "/users/profile",
  },
  sessions: {
    start:   "/sessions/start",
    end:     "/sessions/end",
    history: "/sessions/history",
  },
  quizzes: {
    fetch:           "/quizzes/fetch",
    submit:          "/quizzes/submit",
    result:          (sessionId: string) => `/quizzes/result/${sessionId}`,
    retentionStatus: "/quizzes/retention-status",
  },
  track: {
    checkin:  "/track/checkin",
    interact: "/track/interact",
    labLog:   "/track/lab-log",
    checkout: "/track/checkout",
    labGames: "/track/lab-games",
  },
  retention: {
    trigger: "/retention/trigger",
    quiz:    (token: string) => `/retention/quiz/${token}`,
    submit:  (token: string) => `/retention/submit/${token}`,
  },
  analytics: {
    eis:       (userId: string) => `/analytics/eis/${userId}`,
    session:   (sessionId: string) => `/analytics/session/${sessionId}`,
    dashboard: "/analytics/dashboard",
    visitors:  "/analytics/visitors",
    exhibitTrend: (exhibitId: string) => `/analytics/exhibits/${exhibitId}/trend`,
  },
  admin: {
    exhibits:       "/admin/exhibits",
    exhibitById:    (exhibitId: string) => `/admin/exhibits/${exhibitId}`,
    activateExhibit: (exhibitId: string) => `/admin/exhibits/${exhibitId}/activate`,
    permanentExhibit: (exhibitId: string) => `/admin/exhibits/${exhibitId}/permanent`,
    content:        "/admin/content",
    contentById:    (id: string) => `/admin/content/${id}`,
    media:          "/admin/media",
    mediaById:      (id: string) => `/admin/media/${id}`,
    quizzes:        "/admin/quizzes",
    quizById:       (quizId: string) => `/admin/quizzes/${quizId}`,
    labGames:       "/admin/lab-games",
    labGameById:    (id: string | number) => `/admin/lab-games/${id}`,
  },
} as const;
