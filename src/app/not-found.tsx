import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-4">Not found</p>
      <h1 className="text-4xl text-forest">This page has wandered off.</h1>
      <p className="mt-3 text-muted">Perhaps that’s a sign to return to what matters.</p>
      <Link href="/" className="mt-8 rounded-full bg-forest px-6 py-3 text-sm text-ivory">Return to Today</Link>
    </div>
  );
}
