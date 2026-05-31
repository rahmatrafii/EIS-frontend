export const ROUTES = {
  // Auth & Welcome
  welcome:  "/welcome",
  login:    "/login",
  register: "/register",
  verifyOtp: "/verify-otp",

  // Visitor
  home:      "/home",
  dashboard: "/home", // Map dashboard to /home as per V-06 specifications
  scan:      "/scan",
  score:     "/score",
  profile:   "/profile",
  visitResult: "/visit-result",
  
  exhibit: {
    detail:       (id: string) => `/exhibit/${id}`,
    audio:        (id: string) => `/exhibit/${id}/audio`,
    video:        (id: string) => `/exhibit/${id}/video`,
    infographic:  (id: string) => `/exhibit/${id}/infographic`,
    lab:          (id: string) => `/exhibit/${id}/lab`,
  },
  
  quiz: {
    preZoo:  "/quiz/pre-zoo",
    postZoo: "/quiz/post-zoo",
    result:  "/quiz/result",
  },

  // Admin
  admin: {
    login:     "/admin/login",
    dashboard: "/admin/dashboard",
    exhibits:  "/admin/exhibits",
    content:   "/admin/content",
    media:     "/admin/media",
    quizzes:   "/admin/quizzes",
  },

  // Retention (public)
  retention: (token: string) => `/retention/${token}`,
} as const;
