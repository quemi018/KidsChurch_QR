import { logoutAction } from "@/lib/auth/actions";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="secondary">
        Log Out
      </Button>
    </form>
  );
}
