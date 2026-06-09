// src/app/(admin)/admin/analytics/visitors/[user_id]/page.tsx
import VisitorDetailContent from "./VisitorDetailContent";

interface PageProps {
  params: Promise<{ user_id: string }>;
}

export default async function VisitorDetailPage({ params }: PageProps) {
  const { user_id } = await params;
  return <VisitorDetailContent userId={user_id} />;
}
