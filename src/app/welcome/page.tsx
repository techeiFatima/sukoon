"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { applyOnboarding, loadDraft, saveDraft, type OnboardingDraft } from "@/lib/onboarding";
import { VALUE_SUGGESTIONS } from "@/content/prompts";
import { AuthForm } from "@/components/AuthForm";
import { Button, Chip, cx, ErrorNote, Label, Ornament, TextArea, Wordmark } from "@/components/ui";

const MOTIVATIONS = [
  "I want to reclaim my attention.",
  "I want to strengthen my spirituality.",
  "I want to develop intellectually.",
  "I want to understand myself better.",
  "I want to live more intentionally.",
  "I want a healthier relationship with technology.",
];

const EMPTY: OnboardingDraft = { display_name: "", motivations: [], experience: "general", values: [], change_note: "" };
const STEPS = 6;

export default function Welcome() {
  const { ready, mode, session, store, profile, reloadProfile } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<OnboardingDraft>(EMPTY);
  const [customValue, setCustomValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadDraft();
    if (saved) setD({ ...EMPTY, ...saved });
  }, []);
  useEffect(() => {
    if (ready && profile?.onboarded_at) router.replace("/today");
  }, [ready, profile, router]);

  const patch = (p: Partial<OnboardingDraft>) => setD((x) => ({ ...x, ...p }));
  const toggle = (key: "motivations" | "values", v: string) =>
    setD((x) => ({ ...x, [key]: x[key].includes(v) ? x[key].filter((y) => y !== v) : [...x[key], v] }));
  const next = () => { saveDraft(d); setStep((s) => Math.min(STEPS - 1, s + 1)); };
  const back = () => setStep((s) => Math.max(0, s - 1));

  async function begin() {
    if (!store) return;
    setBusy(true);
    setError(null);
    try {
      await applyOnboarding(store, d);
      await reloadProfile();
      router.replace("/today");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't create your space. Please try again.");
      setBusy(false);
    }
  }

  const needsAccount = mode === "cloud" && !session;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <BackgroundGeometry />
      <header className="relative z-10 flex h-20 items-center justify-between px-6 md:px-10">
        <Wordmark />
        {mode === "cloud" && !session && (
          <Link href="/auth" className="text-[13px] text-muted hover:text-forest">Sign in</Link>
        )}
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-20">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            <motion.section
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
              aria-live="polite"
            >
              {step === 0 && (
                <div className="text-center">
                  <motion.div initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 1.6, ease: "easeOut" }}>
                    <Ornament className="mx-auto mb-10 h-16 w-16 text-sage" />
                  </motion.div>
                  <p className="arabic mb-4 text-2xl text-stone" lang="ar">سُكُون</p>
                  <h1 className="text-[2.6rem] leading-[1.08] text-forest md:text-[3.4rem]">
                    A space to become more intentional about the life you live.
                  </h1>
                  <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-muted">
                    Sukoon means stillness, tranquility. It isn’t built to keep you here. It’s built to help you return to your life — with clearer attention and deeper purpose.
                  </p>
                  <Button size="lg" className="mt-10" onClick={next}>Begin</Button>
                  <p className="mt-6 text-[12px] text-muted">About two minutes. Everything you share stays private.</p>
                </div>
              )}

              {step === 1 && (
                <Step n={1} title="What brings you here?" hint="Choose any that feel true.">
                  <div className="grid gap-2.5">
                    {MOTIVATIONS.map((m) => {
                      const on = d.motivations.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle("motivations", m)}
                          className={cx(
                            "flex items-center justify-between rounded-2xl border px-5 py-4 text-left text-[15px] transition-all duration-200",
                            on ? "border-forest bg-forest text-ivory" : "border-line bg-paper/80 hover:border-sage",
                          )}
                        >
                          {m}
                          <span className={cx("ml-4 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", on ? "border-ivory" : "border-line")}>
                            {on && <Check size={12} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Step>
              )}

              {step === 2 && (
                <Step n={2} title="Choose your experience" hint="You can change this at any time in Settings.">
                  <div className="grid gap-3 md:grid-cols-2">
                    {([
                      { id: "islamic", title: "Islamic experience", body: "Reflection and learning rooted in the Qur’an, the Sunnah, and the Islamic tradition of inner development." },
                      { id: "general", title: "General experience", body: "Intentional living drawing on philosophy, literature, and reflective practice — open to everyone." },
                    ] as const).map((o) => {
                      const on = d.experience === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => patch({ experience: o.id })}
                          className={cx(
                            "rounded-3xl border p-6 text-left transition-all duration-200",
                            on ? "border-forest bg-forest text-ivory" : "border-line bg-paper/80 hover:border-sage",
                          )}
                        >
                          <p className="font-serif text-xl">{o.title}</p>
                          <p className={cx("mt-2 text-sm leading-relaxed", on ? "text-ivory/80" : "text-muted")}>{o.body}</p>
                        </button>
                      );
                    })}
                  </div>
                </Step>
              )}

              {step === 3 && (
                <Step n={3} title="What matters most to you?" hint="Choose a few. You’ll be able to describe what each means to you later.">
                  <div className="flex flex-wrap gap-2">
                    {[...VALUE_SUGGESTIONS, ...d.values.filter((v) => !VALUE_SUGGESTIONS.includes(v))].map((v) => (
                      <Chip key={v} selected={d.values.includes(v)} onClick={() => toggle("values", v)}>{v}</Chip>
                    ))}
                  </div>
                  <form
                    className="mt-6 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = customValue.trim();
                      if (v && !d.values.includes(v)) patch({ values: [...d.values, v] });
                      setCustomValue("");
                    }}
                  >
                    <label htmlFor="cv" className="sr-only">Add your own value</label>
                    <input id="cv" className="field-quiet flex-1" placeholder="Add your own…" value={customValue} onChange={(e) => setCustomValue(e.target.value)} maxLength={40} />
                    <Button type="submit" variant="ghost" size="sm" disabled={!customValue.trim()}>Add</Button>
                  </form>
                </Step>
              )}

              {step === 4 && (
                <Step n={4} title="What would you like to change?" hint="A sentence or two is enough. Only you will see this.">
                  <TextArea
                    aria-label="What would you like to change?"
                    minRows={4}
                    placeholder="I’d like to stop reaching for my phone the moment I feel bored, and spend more time reading…"
                    value={d.change_note}
                    onChange={(e) => patch({ change_note: e.target.value })}
                    maxLength={1000}
                  />
                  <div className="mt-8">
                    <Label htmlFor="name" hint="Optional">What should we call you?</Label>
                    <input id="name" className="field" autoComplete="given-name" value={d.display_name} onChange={(e) => patch({ display_name: e.target.value })} maxLength={40} />
                  </div>
                </Step>
              )}

              {step === 5 && (
                <Step n={5} title="Create your personal space" hint={needsAccount ? "Your reflections are private by default and protected by row-level security. No ads, no trackers, no public profile." : undefined}>
                  {needsAccount ? (
                    <AuthForm initial="signup" onAuthed={() => void reloadProfile()} />
                  ) : (
                    <div>
                      <ul className="mb-8 space-y-3 text-[15px] text-ink">
                        <Pledge>No feeds, no follower counts, no streaks to protect.</Pledge>
                        <Pledge>Your reflections are private. Always.</Pledge>
                        <Pledge>Success means you need Sukoon a little less over time.</Pledge>
                      </ul>
                      {mode === "local" && (
                        <p className="mb-8 rounded-2xl border border-sand bg-sand-soft/50 px-4 py-3 text-[13px] leading-relaxed text-muted">
                          <strong className="font-medium text-ink">Local mode.</strong> Accounts aren’t configured on this installation, so your space will live only in this browser. You can export it any time from Settings.
                        </p>
                      )}
                      <ErrorNote>{error}</ErrorNote>
                      <Button size="lg" className="w-full" onClick={begin} loading={busy}>Enter Sukoon</Button>
                    </div>
                  )}
                </Step>
              )}
            </motion.section>
          </AnimatePresence>

          {step > 0 && (
            <div className="mt-12 flex items-center justify-between">
              <button type="button" onClick={back} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-forest">
                <ArrowLeft size={15} /> Back
              </button>
              <div className="flex gap-1.5" aria-label={`Step ${step} of ${STEPS - 1}`}>
                {Array.from({ length: STEPS - 1 }, (_, i) => (
                  <span key={i} className={cx("h-1.5 rounded-full transition-all duration-500", i + 1 === step ? "w-6 bg-forest" : i + 1 < step ? "w-1.5 bg-sage" : "w-1.5 bg-line")} />
                ))}
              </div>
              {step < STEPS - 1 ? (
                <Button onClick={next} variant={step === 1 && d.motivations.length === 0 ? "secondary" : "primary"}>
                  {(step === 1 && !d.motivations.length) || (step === 3 && !d.values.length) || (step === 4 && !d.change_note) ? "Skip" : "Continue"}
                </Button>
              ) : <span className="w-20" />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-4">{String(n).padStart(2, "0")} — {String(STEPS - 1).padStart(2, "0")}</p>
      <h1 className="text-[2.1rem] leading-tight text-forest md:text-[2.6rem]">{title}</h1>
      {hint && <p className="mb-8 mt-3 text-[15px] leading-relaxed text-muted">{hint}</p>}
      {!hint && <div className="mb-8" />}
      {children}
    </div>
  );
}

function Pledge({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
      {children}
    </li>
  );
}

function BackgroundGeometry() {
  return (
    <svg aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[640px] w-[640px] text-sand/40" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.35">
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 15} 100 100)`}>
          <rect x={40} y={40} width={120} height={120} />
        </g>
      ))}
      <circle cx="100" cy="100" r="85" />
      <circle cx="100" cy="100" r="42" />
    </svg>
  );
}
