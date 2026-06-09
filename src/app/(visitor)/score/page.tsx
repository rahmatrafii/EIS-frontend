import { PageTransition } from "@/components/layout/PageTransition";
import { ScoreContent } from "./ScoreContent";

export const metadata = {
  title: "ZOO - Educational Impact Score",
  description: "Lihat pencapaian dan nilai evaluasi hasil kunjungan belajarmu di ZOO.",
};

export default function ScorePage() {
  return (
    <PageTransition>
      <ScoreContent />
    </PageTransition>
  );
}
