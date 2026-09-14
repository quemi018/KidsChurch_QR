import { PhasePlaceholder } from "@/components/ui/phase-placeholder";

export const metadata = { title: "Session" };

export default async function SessionPage({ params }: PageProps<"/admin/sessions/[sessionId]">) {
  const { sessionId } = await params;
  return <PhasePlaceholder title="Session" phase={6} description={`Session ID: ${sessionId}`} />;
}
