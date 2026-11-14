"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/app-context";
import { localDate } from "@/lib/dates";
import { Button, IconButton } from "../ui";

const NOTICE = ["A worry", "A conversation", "Something I saw online", "Work or study", "A person", "A feeling I can't name", "Nothing in particular"];

export function ReturnToPresent({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [breaths, setBreaths] = useState(0);
  const [noticed, setNoticed] = useState<string | null>(null);
  const [next, setNext] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!open) { setStep(0); setBreaths(0); setNoticed(null); setNext(""); setAdded(false); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  // Breath cycle: 4s in, 6s out.
  useEffect(() => {
    if (step !== 1) return;
    setPhase("in");
    let cancelled = false;
    let t: ReturnType<typeof setTimeout>;
    const cycle = (n: number) => {
      if (cancelled) return;
      setPhase("in");
      t = setTimeout(() => {
        if (cancelled) return;
        setPhase("out");
        t = setTimeout(() => { setBreaths(n + 1); cycle(n + 1); }, 6000);
      }, 4000);
    };
    cycle(0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [step]);

  const screens = [
    <Screen key="pause" eyebrow="One" title="Pause.">
      <p className="text-lg text-ivory/75">Set down whatever you are holding. Let your shoulders drop. There is nowhere you need to be for the next minute.</p>
      <Button className="mt-12 !bg-ivory !text-forest hover:!bg-sand-soft" size="lg" onClick={() => setStep(1)}>I’m here</Button>
    </Screen>,
    <Screen key="breathe" eyebrow="Two" title="Take a breath.">
      <div className="relative mx-auto my-6 flex h-56 w-56 items-center justify-center">
        <motion.div
          aria-hidden
          className="absolute rounded-full border border-sage/40 bg-sage/15"
          animate={{ width: phase === "in" ? 220 : 90, height: phase === "in" ? 220 : 90 }}
          transition={{ duration: phase === "in" ? 4 : 6, ease: "easeInOut" }}
        />
        <motion.div aria-hidden className="absolute h-3 w-3 rounded-full bg-sand" />
        <p className="relative mt-28 font-serif text-xl italic text-ivory/85" aria-live="polite">{phase === "in" ? "Breathe in…" : "…and slowly out"}</p>
      </div>
      <Button className="mt-4 !bg-ivory !text-forest hover:!bg-sand-soft" size="lg" onClick={() => setStep(2)} variant="primary">
        {breaths >= 3 ? "Continue" : "Continue when ready"}
      </Button>
    </Screen>,
    <Screen key="notice" eyebrow="Three" title="Notice what is occupying your mind.">
      <p className="mb-8 text-ivory/70">Simply name it. You don’t need to solve it.</p>
      <div className="flex flex-wrap justify-center gap-2">
        {NOTICE.map((n) => (
          <button key={n} aria-pressed={noticed === n} onClick={() => setNoticed(n)} className={`rounded-full border px-4 py-2 text-sm transition-colors ${noticed === n ? "border-sand bg-sand text-forest" : "border-ivory/25 text-ivory/85 hover:border-ivory/60"}`}>
            {n}
          </button>
        ))}
      </div>
      <Button className="mt-12 !bg-ivory !text-forest hover:!bg-sand-soft" size="lg" onClick={() => setStep(3)}>Continue</Button>
    </Screen>,
    <Screen key="decide" eyebrow="Four" title="What deserves your attention next?">
      <form
        className="mx-auto mt-4 max-w-md"
        onSubmit={async (e) => {
          e.preventDefault();
          if (next.trim() && !added) {
            try { await store.insert("commitments", { title: next.trim(), date: localDate(), done: false, done_at: null }); setAdded(true); } catch { /* non-critical */ }
          }
          setStep(4);
        }}
      >
        <label htmlFor="rtp-next" className="sr-only">What deserves your attention next?</label>
        <input id="rtp-next" autoFocus value={next} onChange={(e) => setNext(e.target.value)} placeholder="One thing…" maxLength={120}
          className="w-full border-b border-ivory/30 bg-transparent py-3 text-center font-serif text-2xl text-ivory placeholder:text-ivory/35 focus:border-sand focus:outline-none" />
        <p className="mt-4 text-[13px] text-ivory/60">{next.trim() ? "We’ll add it to today’s commitments." : "Or leave it blank and simply continue."}</p>
        <Button type="submit" className="mt-10 !bg-ivory !text-forest hover:!bg-sand-soft" size="lg">Decide</Button>
      </form>
    </Screen>,
    <Screen key="done" eyebrow="" title="Go gently.">
      <p className="text-lg text-ivory/75">{next.trim() ? <>Your next step: <span className="text-sand">{next.trim()}</span>.</> : "You returned to yourself. That is enough."}</p>
      <Button className="mt-12 !bg-ivory !text-forest hover:!bg-sand-soft" size="lg" onClick={onClose}>Return</Button>
    </Screen>,
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Return to the present"
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-forest-deep px-6 text-center text-ivory"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <IconButton label="Close" onClick={onClose} className="absolute right-5 top-5 !text-ivory/60 hover:!bg-ivory/10 hover:!text-ivory"><X size={20} /></IconButton>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }} className="w-full max-w-xl py-16">
              {screens[step]}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Screen({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      {eyebrow && <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-sage">{eyebrow}</p>}
      <h2 className="mb-6 text-[2.4rem] leading-tight text-ivory md:text-[3rem]">{title}</h2>
      {children}
    </div>
  );
}
