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
  },
  admin: {
    exhibits:       "/admin/exhibits",
    exhibitById:    (exhibitId: string) => `/admin/exhibits/${exhibitId}`,
    content:        "/admin/content",
    media:          "/admin/media",
    quizzes:        "/admin/quizzes",
  },
} as const;
