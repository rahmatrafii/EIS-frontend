// src/app/(visitor)/scan/page.tsx
import type { Metadata } from "next";
import { ScanContent } from "./ScanContent";

export const metadata: Metadata = {
  title: "Pindai QR Kandang - ZOO",
  description: "Arahkan kamera HP Anda untuk scan QR Code kandang satwa atau ketik kode manual untuk mulai penjelajahan edukatif.",
};

export default function ScanPage() {
  return <ScanContent />;
}
