// src/app/(visitor)/home/page.tsx
import type { Metadata } from "next";
import { HomeContent } from "./HomeContent";

export const metadata: Metadata = {
  title: "Dashboard Penjelajah - ZOO",
  description: "Pantau waktu kunjungan aktif Anda, kumpulkan poin kuis, dan jelajahi berbagai kandang satwa menarik di Kebun Binatang.",
};

export default function HomePage() {
  return <HomeContent />;
}
