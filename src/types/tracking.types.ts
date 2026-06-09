// src/types/tracking.types.ts
import type { Quiz } from "./quiz.types";

// Shape persis seperti backend response data
export interface CheckinInteraction {
  id: number;
  sessionId: number;
  userId: number;
  exhibitId: number;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  clickedAudio: boolean;
  clickedVideo: boolean;
  clickedVisual: boolean;
  clickedInteractive: boolean;
}

export interface CheckinExhibit {
  id: number;
  name: string;
  zoneName: string;
  description: string;
}

export interface CheckinLearningContent {
  id: number;
  contentTitle: string;
  contentBody: string;
  createdAt: string;
}

export interface CheckinPayload {
  qrCodeIdentifier: string;
  sessionId: number;
}

export interface CheckinMedia {
  id: number;
  mediaType: "AUDIO" | "VIDEO" | "IMAGE_INFOGRAPHIC" | "INTERACTIVE_LAB";
  title: string;
  fileUrl: string;
}

export interface CheckinResult {
  interaction: CheckinInteraction;
  exhibit: CheckinExhibit;
  learningContents: CheckinLearningContent[];
  media: CheckinMedia[];
  quizzes: Quiz[];
}

export interface InteractPayload {
  interactionId: number;
  mediaType: "AUDIO" | "VIDEO" | "IMAGE_INFOGRAPHIC" | "INTERACTIVE_LAB";
}

export interface LabLogPayload {
  interactionId: number;
  gameName: string;
  actionTaken: string;
  scoreAchieved?: number;
}

export interface CheckoutPayload {
  interactionId: number;
}
