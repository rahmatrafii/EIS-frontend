import { PageTransition } from "@/components/layout/PageTransition";
import { PostZooContent } from "./PostZooContent";

export const metadata = {
  title: "ZOO - Kuis Akhir Petualangan",
  description: "Uji kembali pengetahuan satwamu sebelum mengakhiri petualangan seru di ZOO.",
};

export default function PostZooPage() {
  return (
    <PageTransition>
      <PostZooContent />
    </PageTransition>
  );
}
