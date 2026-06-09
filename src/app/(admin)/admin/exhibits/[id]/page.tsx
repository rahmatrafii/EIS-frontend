// src/app/(admin)/admin/exhibits/[id]/page.tsx
import ExhibitDetailContent from "./ExhibitDetailContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExhibitDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ExhibitDetailContent id={Number(id)} />;
}
