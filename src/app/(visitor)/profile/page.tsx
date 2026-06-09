// src/app/(visitor)/profile/page.tsx
import type { Metadata } from "next";
import { ProfileContent } from "./ProfileContent"; 

export const metadata: Metadata = {
  title: "Profil Penjelajah - ZOO",
  description: "Lihat data diri Anda, tinjau riwayat petualangan edukasi Anda, dan periksa status kuis retensi kunjungan Kebun Binatang.",
};

export default function ProfilePage() {
  return <ProfileContent />;
}
