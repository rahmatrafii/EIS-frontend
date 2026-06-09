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
    analyticsExhibits: "/admin/analytics/exhibits",
    analyticsVisitors: "/admin/analytics/visitors",
    visitorDetail: (id: string | number) => `/admin/analytics/visitors/${id}`,
    exhibits:  "/admin/exhibits",
    exhibitDetail: (id: string | number) => `/admin/exhibits/${id}`,
    exhibitNew: "/admin/exhibits/new",
    quizzes:   "/admin/quizzes",
    quizBuilder: (id: string | number) => `/admin/quizzes/${id}`,
  },

  // Retention (public)
  retention: (token: string) => `/retention/${token}`,
} as const;
