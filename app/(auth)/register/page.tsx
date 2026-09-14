import { PhasePlaceholder } from "@/components/ui/phase-placeholder";

export const metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <PhasePlaceholder
      title="Create Account"
      phase={4}
      description="Guardian registration with one or more children (Registration Station only)."
    />
  );
}
