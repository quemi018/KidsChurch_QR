import { AppHeader } from "@/components/ui/app-header";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">{children}</main>
    </>
  );
}
