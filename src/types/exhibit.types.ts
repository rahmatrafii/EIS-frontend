// src/types/exhibit.types.ts

export type MediaType = "audio" | "video" | "infographic" | "lab";
export type AgeCategory = "CHILD" | "TEEN" | "ADULT" | "ALL";

export interface Exhibit {
  id: number;
  name: string;
  description: string;
  qrCode: string;
  location: string;
  imageUrl?: string;
  zone?: string;
  emoji?: string;
  createdAt: string;
}

export interface ExhibitMedia {
  id: number;
  exhibitId: number;
  type: MediaType;
  url: string;
  title: string;
  ageCategory: AgeCategory;
}

export interface LearningPathContent {
  id: number;
  exhibitId: number;
  title?: string;
  contentTitle?: string;
  body?: string;
  contentBody?: string;
  ageCategory: AgeCategory;
}
