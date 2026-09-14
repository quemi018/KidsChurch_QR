import { LogoutButton } from "@/components/auth/logout-button";
import { FormAlert } from "@/components/ui/form-alert";

export const metadata = { title: "Account Deactivated" };

export default function DeactivatedPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account Deactivated</h1>
      <FormAlert tone="warning">
        This account has been deactivated. Please ask a Kids Church Admin for assistance.
      </FormAlert>
      <LogoutButton />
    </div>
  );
}
