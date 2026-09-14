import { PhasePlaceholder } from "@/components/ui/phase-placeholder";

export const metadata = { title: "My Children" };

export default function MemberDashboardPage() {
  return (
    <PhasePlaceholder
      title="My Children"
      phase={4}
      description="Guardian dashboard: child cards with View QR and Edit Child."
    />
  );
}
