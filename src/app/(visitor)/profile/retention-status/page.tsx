// src/app/(visitor)/profile/retention-status/page.tsx
import type { Metadata } from "next";
import { RetentionStatusContent } from "./RetentionStatusContent";

export const metadata: Metadata = {
  title: "Status Kuis Retensi - ZOO",
  description: "Pantau status pengiriman email dan pengerjaan kuis retensi H+7 serta H+30 kunjungan Anda di Kebun Binatang.",
};

export default function RetentionStatusPage() {
  return <RetentionStatusContent />;
}
