import { PhasePlaceholder } from "@/components/ui/phase-placeholder";

export const metadata = { title: "Child Details" };

export default async function AdminChildPage({ params }: PageProps<"/admin/children/[childId]">) {
  const { childId } = await params;
  return <PhasePlaceholder title="Child Details" phase={4} description={`Child ID: ${childId}`} />;
}
