export interface VisitedExhibitDetail {
  id: number;
  name: string;
  zone: string;
  visitedAt: string;
  durationMinutes: number;
  emoji?: string;
  mediaClicked?: {
    audio: boolean;
    video: boolean;
    visual: boolean;
    interactive: boolean;
  };
}

export interface SessionAnalytics {
  sessionId: number;
  userId: number;
  visitDate: string;
  checkInAt: string;
  checkOutAt: string | null;
  isCompleted: boolean;
  totalDurationSeconds: number;
  totalExhibitsVisited: number;
  favoriteMedia: string | null;
  preTestScore: number;
  postTestScore: number | null;
  knowledgeGain: number | null;
  visitedExhibits: VisitedExhibitDetail[];
  mediaEngagement: {
    audioCount: number;
    videoCount: number;
    infographicCount: number;
    labCount: number;
  };
}

export interface EisScore {
  userId: number;
  sessionId: number | null;
  preZooScore: number;
  postZooScore: number;
  knowledgeGainScore: number;
  totalDurationSeconds: number;
  totalExhibitsVisited: number;
  engagementScore: number;
  retention1wScore: number | null;
  retention1mScore: number | null;
  retentionScore: number;
  finalEisScore: number;
  grade: "S" | "A" | "B" | "C" | "D";
  badge: string;
}
