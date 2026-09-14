import { PhasePlaceholder } from "@/components/ui/phase-placeholder";

export const metadata = { title: "Child QR Code" };

export default async function ChildQrPage({ params }: PageProps<"/member/children/[childId]/qr">) {
  const { childId } = await params;
  return (
    <PhasePlaceholder
      title="Child QR Code"
      phase={5}
      description={`Permanent QR for child ID: ${childId}`}
    />
  );
}
