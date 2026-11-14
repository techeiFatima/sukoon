"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase-client";
import { Button, ErrorNote, Label } from "./ui";

/** Email + password auth via Supabase. Used by onboarding (sign up) and /auth (sign in). */
export function AuthForm({ initial = "signin", onAuthed }: { initial?: "signin" | "signup"; onAuthed?: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const supabase = getSupabase();

  if (!supabase) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) onAuthed?.();
        else setNotice("Check your inbox to confirm your email. Your answers are kept on this device until you sign in.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthed?.();
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
        if (error) throw error;
        setNotice("If an account exists for that email, a reset link is on its way.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full space-y-5" noValidate>
      <div>
        <Label htmlFor="email">Email</Label>
        <input id="email" type="email" autoComplete="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {mode !== "reset" && (
        <div>
          <Label htmlFor="password" hint={mode === "signup" ? "At least 8 characters" : undefined}>Password</Label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={8}
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}
      <ErrorNote>{error}</ErrorNote>
      {notice && <p role="status" className="rounded-2xl bg-sage-soft/70 px-4 py-3 text-sm text-forest">{notice}</p>}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={busy}
        disabled={!email || (mode !== "reset" && password.length < 8)}
      >
        {mode === "signup" ? "Create my private space" : mode === "signin" ? "Sign in" : "Send reset link"}
      </Button>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-muted">
        {mode !== "signin" && <button type="button" className="underline-offset-4 hover:underline" onClick={() => setMode("signin")}>I already have an account</button>}
        {mode !== "signup" && <button type="button" className="underline-offset-4 hover:underline" onClick={() => setMode("signup")}>Create an account</button>}
        {mode === "signin" && <button type="button" className="underline-offset-4 hover:underline" onClick={() => setMode("reset")}>Forgot password</button>}
      </div>
    </form>
  );
}
