import { AppHeader } from "@/components/ui/app-header";

export default function MemberLayout({ children }: LayoutProps<"/member">) {
  return (
    <>
      <AppHeader area="Member" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
