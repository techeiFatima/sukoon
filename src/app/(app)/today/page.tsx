"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Pencil, RefreshCw } from "lucide-react";
import { useApp, useStore } from "@/lib/app-context";
import { dayOfYear, formatLongDate, greeting, localDate } from "@/lib/dates";
import { useAutosaveReflection } from "@/lib/useAutosave";
import type { DailyIntention } from "@/lib/types";
import { DAILY_QUESTIONS, INTENTION_EXAMPLES_GENERAL, INTENTION_EXAMPLES_ISLAMIC } from "@/content/prompts";
import { Commitments } from "@/components/Commitments";
import { ThoughtCard } from "@/components/ThoughtCard";
import { Breath, Button, Chip, ErrorNote, FadeIn, IconButton, SavedHint, TextArea } from "@/components/ui";

export default function Today() {
  const { profile } = useApp();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const g = greeting(now ?? new Date());
  const name = profile?.display_name;

  return (
    <div>
      <FadeIn>
        <header className="mb-14 md:mb-20">
          <p className="eyebrow mb-4">{now ? formatLongDate(now) : " "}</p>
          <h1 className="text-[2.6rem] leading-[1.04] text-forest md:text-[3.8rem]">
            {g.salutation}{name ? `, ${name}` : ""}.
          </h1>
          <p className="mt-3 font-serif text-xl italic text-muted md:text-2xl">{g.line}</p>
        </header>
      </FadeIn>

      <div className="grid gap-14 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div className="space-y-14">
          <FadeIn delay={0.08}><Intention /></FadeIn>
          <FadeIn delay={0.16}><DailyReflection /></FadeIn>
        </div>
        <div className="space-y-12">
          <FadeIn delay={0.22}>
            <section aria-labelledby="commit-h">
              <h2 id="commit-h" className="eyebrow mb-5">Today’s commitments</h2>
              <Commitments />
            </section>
          </FadeIn>
          <FadeIn delay={0.3}><ThoughtCard /></FadeIn>
        </div>
      </div>

      <footer className="mt-24 border-t border-line pt-10 text-center">
        <p className="font-serif text-xl text-forest">That’s all Sukoon needs from you today.</p>
        <p className="mt-2 text-sm text-muted">
          Close the app and go live it — or take a moment to{" "}
          <Link href="/mind?reset=1" className="text-forest underline underline-offset-4">return to the present</Link>.
        </p>
      </footer>
    </div>
  );
}

function Intention() {
  const store = useStore();
  const { profile } = useApp();
  const today = localDate();
  const [row, setRow] = useState<DailyIntention | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    store
      .list("daily_intentions", { eq: { date: today } })
      .then((r) => { setRow(r[0] ?? null); setDraft(r[0]?.text ?? ""); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [store, today]);

  async function save() {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      const next = row ? await store.update("daily_intentions", row.id, { text }) : await store.insert("daily_intentions", { date: today, text });
      setRow(next);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  const examples = profile?.experience === "islamic" ? INTENTION_EXAMPLES_ISLAMIC : INTENTION_EXAMPLES_GENERAL;

  if (loading) return <div className="h-40"><Breath small /></div>;

  return (
    <section aria-labelledby="intention-h">
      <h2 id="intention-h" className="eyebrow mb-5">Intention</h2>
      {row && !editing ? (
        <div className="group">
          <p className="font-serif text-[2rem] leading-tight text-forest md:text-[2.4rem]">{row.text}</p>
          <button onClick={() => setEditing(true)} className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-forest">
            <Pencil size={13} /> Revise intention
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void save(); }}>
          <label htmlFor="intention" className="mb-4 block font-serif text-[1.8rem] leading-tight text-forest md:text-[2.1rem]">
            What matters most to you today?
          </label>
          <input
            id="intention"
            className="field-quiet font-serif text-xl md:text-2xl"
            placeholder="One intention…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={140}
            autoComplete="off"
          />
          <div className="mt-5 flex flex-wrap gap-2">
            {examples.map((x) => <Chip key={x} onClick={() => setDraft(x)}>{x}</Chip>)}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Button type="submit" disabled={!draft.trim()} loading={busy}>Set intention</Button>
            {row && <Button variant="quiet" onClick={() => { setEditing(false); setDraft(row.text); }}>Cancel</Button>}
          </div>
        </form>
      )}
      <ErrorNote>{error}</ErrorNote>
    </section>
  );
}

function DailyReflection() {
  const today = localDate();
  const [offset, setOffset] = useState(0);
  const suggested = useMemo(() => DAILY_QUESTIONS[(dayOfYear() + offset) % DAILY_QUESTIONS.length], [offset]);
  const [question, setQuestion] = useState(suggested);
  const r = useAutosaveReflection({ kind: "daily", date: today, prompt: question });
  // Keep showing the question the person actually answered.
  useEffect(() => {
    if (r.savedPrompt && offset === 0) setQuestion(r.savedPrompt);
    else setQuestion(suggested);
  }, [r.savedPrompt, suggested, offset]);

  return (
    <section aria-labelledby="reflect-h" className="card p-7 md:p-9">
      <div className="mb-5 flex items-center justify-between">
        <h2 id="reflect-h" className="eyebrow">Reflection</h2>
        {!r.text && (
          <IconButton label="A different question" onClick={() => setOffset((o) => o + 1)} className="h-8 w-8">
            <RefreshCw size={14} />
          </IconButton>
        )}
      </div>
      <p className="mb-6 font-serif text-[1.6rem] leading-snug text-forest">{question}</p>
      <TextArea
        aria-label={question}
        minRows={5}
        className="!border-transparent !bg-transparent !px-0 text-[15.5px] focus:!shadow-none"
        placeholder="Write freely. No one else will read this."
        value={r.text}
        onChange={(e) => r.setText(e.target.value)}
        disabled={r.loading}
      />
      <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
        <span className="text-[12px] text-muted">Private to you</span>
        <SavedHint state={r.state} />
      </div>
    </section>
  );
}
