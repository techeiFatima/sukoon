"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Cloud, Lock, RotateCcw, Smartphone } from "lucide-react";
import { useApp, useStore } from "@/lib/app-context";
import { localReply, type GoalPlan } from "@/lib/ai/localGuide";
import { INTENTS, LIMITS, type ChatMessage, type Intent } from "@/lib/ai/types";
import { uid } from "@/lib/store/local";
import { Breath, Button, cx, ErrorNote, Modal, PageHeader } from "@/components/ui";

interface Msg extends ChatMessage { id: string; plan?: GoalPlan; source?: "local" | "cloud" }

export default function Companion() {
  const { profile, updateProfile, session, mode: storageMode } = useApp();
  const store = useStore();
  const [cloudAvailable, setCloudAvailable] = useState(false);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/companion").then((r) => r.json()).then((d) => setCloudAvailable(Boolean(d.cloudAvailable))).catch(() => setCloudAvailable(false));
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, thinking]);

  const aiMode = profile?.ai_mode ?? "off";
  const useCloud = aiMode === "cloud" && cloudAvailable && Boolean(profile?.ai_consent_at);

  if (aiMode === "off") {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <PageHeader eyebrow="Companion" title="The reflection companion is off" />
        <p className="-mt-8 mb-8 text-[15px] leading-relaxed text-muted">You turned it off, and Sukoon works fully without it. If you’d like it back, the on-device guide never sends your words anywhere.</p>
        <Button onClick={() => updateProfile({ ai_mode: "local" })}>Turn on the on-device guide</Button>
      </div>
    );
  }

  function start(i: Intent) {
    setIntent(i);
    setPlanSaved(false);
    setError(null);
    const opener = INTENTS.find((x) => x.id === i)!.opener;
    setMessages([{ id: uid(), role: "assistant", content: opener, source: useCloud ? "cloud" : "local" }]);
  }

  async function send() {
    const text = input.trim();
    if (!text || !intent || thinking) return;
    if (text.length > LIMITS.maxChars) { setError("That’s a lot to hold at once — try sharing a shorter piece."); return; }
    const next: Msg[] = [...messages, { id: uid(), role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setThinking(true);
    try {
      if (useCloud) {
        const res = await fetch("/api/companion", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
          body: JSON.stringify({ consent: true, intent, messages: next.slice(-LIMITS.maxMessages).map(({ role, content }) => ({ role, content })) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "The companion couldn’t respond.");
        setMessages((m) => [...m, { id: uid(), role: "assistant", content: data.reply, source: "cloud" }]);
      } else {
        await new Promise((r) => setTimeout(r, 650 + Math.random() * 500)); // a breath, not a performance
        const r = localReply(next, intent);
        setMessages((m) => [...m, { id: uid(), role: "assistant", content: r.reply, plan: r.plan, source: "local" }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Companion" title="Think it through">
        A quiet space to examine patterns, clarify values, and turn intentions into steps. It asks more than it tells.
      </PageHeader>

      <div className="mb-10 flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4 text-[13px] md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          {useCloud ? <Cloud size={16} className="mt-0.5 shrink-0 text-forest" /> : <Smartphone size={16} className="mt-0.5 shrink-0 text-forest" />}
          <p className="leading-relaxed text-muted">
            {useCloud ? (
              <><strong className="font-medium text-ink">Claude (cloud).</strong> Messages in this conversation are sent to Anthropic to generate replies. Your journal and other data are never included. Nothing is saved.</>
            ) : (
              <><strong className="font-medium text-ink">On-device guide.</strong> Runs entirely in your browser — your words never leave this device. It offers reflective questions; it doesn’t understand language like an AI. Nothing is saved.</>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {cloudAvailable && !useCloud && <Button size="sm" variant="secondary" onClick={() => setConsentOpen(true)}>Use Claude</Button>}
          {useCloud && <Button size="sm" variant="secondary" onClick={() => updateProfile({ ai_mode: "local" })}>Use on-device</Button>}
        </div>
      </div>

      {!intent ? (
        <div>
          <p className="mb-5 font-serif text-[1.6rem] text-forest">What would you like to reflect on?</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {INTENTS.map((i) => (
              <li key={i.id}>
                <button onClick={() => start(i.id)} className="card w-full p-5 text-left text-[15px] text-ink transition-colors hover:border-sage">{i.label}</button>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-[12px] leading-relaxed text-muted">
            The companion is not a therapist, doctor, or scholar, and cannot give medical advice or religious rulings. If you are struggling, please talk to someone you trust or a qualified professional.
          </p>
        </div>
      ) : (
        <div>
          <ol className="space-y-8" aria-live="polite">
            {messages.map((m) => (
              <motion.li key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={cx(m.role === "user" ? "flex justify-end" : "")}>
                {m.role === "assistant" ? (
                  <div className="max-w-[90%]">
                    <p className="whitespace-pre-wrap font-serif text-[1.3rem] leading-relaxed text-forest">{m.content}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-stone">{m.source === "cloud" ? "AI-generated by Claude · a suggestion, not advice" : "On-device guide"}</p>
                    {m.plan && <PlanCard plan={m.plan} saved={planSaved} onSave={async () => {
                      try {
                        await store.insert("personal_goals", { area: "personal", title: m.plan!.goal.slice(0, 140), why: `Done looks like: ${m.plan!.done}`.slice(0, 600), steps: [{ id: uid(), title: `${m.plan!.step} — ${m.plan!.when}`.slice(0, 140), done: false }], status: "active" });
                        setPlanSaved(true);
                      } catch (e) { setError(e instanceof Error ? e.message : "Could not save."); }
                    }} />}
                  </div>
                ) : (
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-sage-soft px-5 py-3.5 text-[15px] leading-relaxed text-ink">{m.content}</p>
                )}
              </motion.li>
            ))}
            {thinking && <li><Breath small label="Reflecting…" /></li>}
          </ol>
          <div ref={endRef} />
          <ErrorNote>{error}</ErrorNote>

          <form className="sticky bottom-20 mt-10 md:bottom-6" onSubmit={(e) => { e.preventDefault(); void send(); }}>
            <div className="flex items-end gap-2 rounded-[26px] border border-line bg-paper p-2 pl-5 shadow-[0_8px_30px_-12px_rgba(35,63,53,0.18)]">
              <label htmlFor="c-in" className="sr-only">Your reply</label>
              <textarea
                id="c-in"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                placeholder="Take your time…"
                className="max-h-40 flex-1 resize-none bg-transparent py-2.5 text-[15px] focus:outline-none"
                maxLength={LIMITS.maxChars}
              />
              <button type="submit" disabled={!input.trim() || thinking} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-ivory transition-opacity disabled:opacity-30">
                <ArrowUp size={17} />
              </button>
            </div>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
            <button onClick={() => { setIntent(null); setMessages([]); }} className="inline-flex items-center gap-1.5 hover:text-forest"><RotateCcw size={13} /> Start over</button>
            <span className="inline-flex items-center gap-1.5"><Lock size={12} /> This conversation disappears when you leave. <Link href="/soul?tab=journal" className="text-forest underline underline-offset-4">Keep what matters in your journal.</Link></span>
          </div>
        </div>
      )}

      <Modal open={consentOpen} onClose={() => setConsentOpen(false)} title="Before you use Claude">
        <div className="space-y-4 text-[15px] leading-relaxed text-ink">
          <p>With cloud reflection on, the messages you type <strong className="font-medium">in the companion only</strong> are sent through Sukoon’s server to Anthropic’s Claude API to generate replies.</p>
          <ul className="space-y-2 text-sm text-muted">
            <li>• Your journal, reflections, check-ins, and other data are never sent.</li>
            <li>• Sukoon does not store or log these conversations.</li>
            <li>• Anthropic processes them under its API terms and privacy policy.</li>
            <li>• Replies are AI-generated suggestions — not professional, medical, or religious advice.</li>
            {storageMode === "local" && <li>• This installation has no accounts, so the server cannot verify who is using it.</li>}
          </ul>
          <p className="text-sm text-muted">You can switch back to the on-device guide or turn the companion off at any time in Settings.</p>
        </div>
        <div className="mt-8 flex justify-end gap-2">
          <Button variant="quiet" onClick={() => setConsentOpen(false)}>Not now</Button>
          <Button onClick={async () => { await updateProfile({ ai_mode: "cloud", ai_consent_at: new Date().toISOString() }); setConsentOpen(false); if (intent) start(intent); }}>I understand — use Claude</Button>
        </div>
      </Modal>
    </div>
  );
}

function PlanCard({ plan, saved, onSave }: { plan: GoalPlan; saved: boolean; onSave: () => void }) {
  return (
    <div className="card mt-5 p-6">
      <dl className="space-y-3 text-[14px]">
        {[["Goal", plan.goal], ["Done looks like", plan.done], ["First step", plan.step], ["When", plan.when]].map(([k, v]) => (
          <div key={k}><dt className="eyebrow">{k}</dt><dd className="mt-0.5 text-ink">{v}</dd></div>
        ))}
      </dl>
      <div className="mt-5 flex items-center gap-4">
        <Button size="sm" onClick={onSave} disabled={saved}>{saved ? "Saved to your goals" : "Save to My Life → Goals"}</Button>
        {saved && <Link href="/life?tab=goals" className="text-[13px] text-forest underline underline-offset-4">View</Link>}
      </div>
    </div>
  );
}
