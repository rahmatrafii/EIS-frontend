// src/app/retention/[token]/page.tsx
import { RetentionQuizContent } from "./RetentionQuizContent";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function RetentionQuizPage({ params }: PageProps) {
  const { token } = await params;
  return <RetentionQuizContent token={token} />;
}
