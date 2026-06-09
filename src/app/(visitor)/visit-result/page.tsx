import { Suspense } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { VisitResultContent } from "./VisitResultContent";
import { PageLoader } from "@/components/ui/PageLoader";

export const metadata = {
  title: "ZOO - Ringkasan Hasil Kunjungan",
  description: "Selamat atas selesainya petualangan belajarmu! Lihat rangkuman kunjunganmu di sini.",
};

export default function VisitResultPage() {
  return (
    <PageTransition>
      <Suspense fallback={<PageLoader text="Menyusun ringkasan petualangan belajarmu..." minHeight="min-h-[60vh]" />}>
        <VisitResultContent />
      </Suspense>
    </PageTransition>
  );
}
