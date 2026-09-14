import { PhasePlaceholder } from "@/components/ui/phase-placeholder";

export const metadata = { title: "Log In" };

export default function LoginPage() {
  return (
    <PhasePlaceholder
      title="Log In"
      phase={3}
      description="Mobile number + password sign-in for guardians and Admins."
    />
  );
}
