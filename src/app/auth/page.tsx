"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { getSupabase } from "@/lib/supabase-client";
import { AuthForm } from "@/components/AuthForm";
import { Button, ErrorNote, FadeIn, Label, Wordmark } from "@/components/ui";

export default function AuthPage() {
  const { mode, session, ready, profile } = useApp();
  const router = useRouter();
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange((e) => { if (e === "PASSWORD_RECOVERY") setRecovery(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (ready && session && !recovery) router.replace(profile?.onboarded_at ? "/today" : "/welcome");
  }, [ready, session, profile, router, recovery]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <FadeIn className="w-full max-w-sm">
        <div className="mb-12 flex justify-center"><Wordmark /></div>
        {mode === "local" ? (
          <div className="text-center">
            <h1 className="text-3xl text-forest">You’re in Local Mode</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Accounts are not configured for this installation, so everything you write is stored only in this browser. Nothing is sent to a server.
            </p>
            <Link href="/" className="mt-8 inline-block"><Button size="lg">Continue</Button></Link>
          </div>
        ) : recovery ? (
          <NewPassword onDone={() => setRecovery(false)} />
        ) : (
          <>
            <h1 className="mb-2 text-center text-3xl text-forest">Welcome back</h1>
            <p className="mb-10 text-center text-[15px] text-muted">Return to your private space.</p>
            <AuthForm initial="signin" />
            <p className="mt-10 text-center text-[13px] text-muted">
              New here? <Link href="/welcome" className="text-forest underline underline-offset-4">Begin with a short welcome</Link>
            </p>
          </>
        )}
      </FadeIn>
    </div>
  );
}

function NewPassword({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await getSupabase()!.auth.updateUser({ password: pw });
        setBusy(false);
        if (error) setError(error.message);
        else onDone();
      }}
    >
      <h1 className="text-center text-3xl text-forest">Choose a new password</h1>
      <div>
        <Label htmlFor="npw" hint="At least 8 characters">New password</Label>
        <input id="npw" type="password" autoComplete="new-password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} />
      </div>
      <ErrorNote>{error}</ErrorNote>
      <Button type="submit" size="lg" className="w-full" loading={busy} disabled={pw.length < 8}>Save password</Button>
    </form>
  );
}
