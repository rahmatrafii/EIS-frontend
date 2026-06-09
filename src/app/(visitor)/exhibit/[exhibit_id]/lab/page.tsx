import type { Metadata } from "next";
import { LabGameContent } from "./LabGameContent";

export const metadata: Metadata = {
  title: "Lab Interaktif - ZOO",
  description: "Mainkan game edukasi interaktif untuk memperdalam pengetahuan konservasi satwa.",
};

interface PageProps {
  params: Promise<{ exhibit_id: string }>;
}

export default async function LabPage({ params }: PageProps) {
  const { exhibit_id } = await params;
  return <LabGameContent exhibitId={exhibit_id} />;
}
