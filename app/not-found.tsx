import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link href="/" className="text-blue-600 underline-offset-4 hover:underline">
        Back to home
      </Link>
    </main>
  );
}
