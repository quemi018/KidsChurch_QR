import { PhasePlaceholder } from "@/components/ui/phase-placeholder";

export const metadata = { title: "Child" };

export default async function ChildPage({ params }: PageProps<"/member/children/[childId]">) {
  const { childId } = await params;
  return <PhasePlaceholder title="Child" phase={4} description={`Child ID: ${childId}`} />;
}
