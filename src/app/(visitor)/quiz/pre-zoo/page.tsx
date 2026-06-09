import { PageTransition } from "@/components/layout/PageTransition";
import { PreZooContent } from "./PreZooContent"; 

export const metadata = {
  title: "ZOO - Kuis Awal Petualangan",
  description: "Uji pengetahuan satwamu sebelum memulai petualangan di ZOO.",
};

export default function PreZooPage() {
  return (
    <PageTransition>
      <PreZooContent />
    </PageTransition>
  );
}
