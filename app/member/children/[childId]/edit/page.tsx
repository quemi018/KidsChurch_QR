import { PhasePlaceholder } from "@/components/ui/phase-placeholder";

export const metadata = { title: "Edit Child" };

export default async function EditChildPage({
  params,
}: PageProps<"/member/children/[childId]/edit">) {
  const { childId } = await params;
  return <PhasePlaceholder title="Edit Child" phase={4} description={`Child ID: ${childId}`} />;
}
