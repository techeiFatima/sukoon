"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-4">Something went wrong</p>
      <h1 className="text-4xl text-forest">Let’s take a breath and try again.</h1>
      <p className="mt-3 max-w-md text-muted">Your saved writing is safe. This screen failed to load.</p>
      <button onClick={reset} className="mt-8 rounded-full bg-forest px-6 py-3 text-sm text-ivory">Try again</button>
    </div>
  );
}
