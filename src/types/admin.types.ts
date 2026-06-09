// src/types/admin.types.ts

// === Dashboard Types (existing) ===

export interface ActiveUser {
  id: number;
  name: string;
}

export interface DashboardSummary {
  total_visitors: number;
  avg_eis_score: number;
  avg_duration_minutes: number;
  active_sessions: number;
  active_users: ActiveUser[];
}

export interface TopExhibit {
  exhibit_id: number;
  exhibit_name: string;
  avg_duration: number;
}

export interface MediaEffectiveness {
  media_type: "AUDIO" | "VIDEO" | "IMAGE_INFOGRAPHIC" | "INTERACTIVE_LAB";
  avg_knowledge_gain: number;
}

export interface AgeCategoryPerformance {
  age_category: "CHILD" | "TEEN" | "ADULT";
  avg_eis_score: number;
}

export interface TrendItem {
  name: string;
  visitors: number;
  eis: number;
}

export interface DashboardAnalytics {
  summary: DashboardSummary;
  top_exhibits: TopExhibit[];
  media_effectiveness: MediaEffectiveness[];
  age_category_performance: AgeCategoryPerformance[];
  trend?: TrendItem[];
}

// === A-06: Manajemen Kandang Types ===

/** Status konten per kategori usia: apakah teks dan media sudah lengkap */
export interface ContentStatus {
  hasText: boolean;
  hasMedia: boolean;
}

/** Representasi satu exhibit dari GET /admin/exhibits */
export interface AdminExhibit {
  id: number;
  name: string;
  zone_name: string;
  description: string;
  image_url?: string | null;
  qr_code_identifier: string;
  is_active: boolean;
  created_at: string;
  content_status: {
    CHILD: ContentStatus;
    TEEN: ContentStatus;
    ADULT: ContentStatus;
  };
}

// === Filter state untuk halaman daftar kandang ===
export interface ExhibitFilters {
  search: string;
  zone: string; // '' = semua zona
  status: "all" | "active" | "inactive";
}

// === A-07: Detail & Edit Kandang Types ===

export interface AdminExhibitMedia {
  id: number;
  exhibitId: number;
  ageCategory: "CHILD" | "TEEN" | "ADULT" | "ALL";
  mediaType: "AUDIO" | "VIDEO" | "IMAGE_INFOGRAPHIC" | "INTERACTIVE_LAB";
  title: string;
  fileUrl: string;
  created_at: string;
}

export interface AdminLearningContent {
  id?: number;
  exhibitId: number;
  ageCategory: "CHILD" | "TEEN" | "ADULT";
  contentTitle: string;
  contentBody: string;
  updatedAt?: string;
}

export interface AdminExhibitDetail extends AdminExhibit {
  media: AdminExhibitMedia[];
  learningContent: AdminLearningContent[];
  stats?: {
    totalVisitors: number;
    avgDurationMinutes: number;
    favoriteMedia: string;
    knowledgeGainPercent: number;
  };
}

// === A-09: Manajemen Kuis Types ===
export interface AdminQuiz {
  id: number;
  title: string;
  quizType: "PRE_ZOO" | "POST_ZOO" | "RETENTION_1W" | "RETENTION_1M";
  scope: "GLOBAL" | "EXHIBIT";
  ageCategory: "CHILD" | "TEEN" | "ADULT";
  exhibitId: number | null;
  exhibitName?: string;
  createdAt: string;
  questions: {
    id: number;
    quizId: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: "A" | "B" | "C" | "D";
    points: number;
  }[];
}

export interface QuizFilters {
  search: string;
  quizType: string;
  ageCategory: string;
  scope: string;
}

// === Lab Game Types ===
export type LabGameType = "DRAG_DROP" | "MATCHING" | "PICTURE_CHOICE";

export interface DragDropConfig {
  target: {
    imageUrl: string;
    label: string;
  };
  items: {
    id: string | number;
    imageUrl: string;
    label: string;
    isCorrect: boolean;
  }[];
}

export interface MatchingConfig {
  pairs: {
    id: string | number;
    threat: string;
    solution: string;
  }[];
}

export interface PictureChoiceConfig {
  question: string;
  options: {
    id: string | number;
    imageUrl: string;
    label: string;
    isCorrect: boolean;
  }[];
}

export interface AdminLabGame {
  id: number;
  exhibitId: number;
  ageCategory: "CHILD" | "TEEN" | "ADULT" | "ALL";
  gameType: LabGameType;
  title: string;
  gameConfig: DragDropConfig | MatchingConfig | PictureChoiceConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}



