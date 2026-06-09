import type { Metadata } from "next";
import { ExhibitDetailContent } from "./ExhibitDetailContent"; 

export const metadata: Metadata = {
  title: "Detail Kandang Satwa - ZOO",
  description: "Pelajari informasi menarik, saksikan infografis, dengarkan suara satwa, dan mainkan games edukatif yang seru.",
};

interface PageProps {
  params: Promise<{ exhibit_id: string }>;
}

export default async function ExhibitDetailPage({ params }: PageProps) {
  const { exhibit_id } = await params;
  return <ExhibitDetailContent exhibitId={exhibit_id} />;
}
