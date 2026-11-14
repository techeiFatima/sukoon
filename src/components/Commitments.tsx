"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { addDays, localDate } from "@/lib/dates";
import { useCollection } from "@/lib/hooks";
import { useApp } from "@/lib/app-context";
import { COMMITMENT_SUGGESTIONS, COMMITMENT_SUGGESTIONS_ISLAMIC } from "@/content/prompts";
import { Button, Chip, cx, ErrorNote, IconButton } from "./ui";

export function Commitments() {
  const { profile } = useApp();
  const today = localDate();
  const yesterday = localDate(addDays(new Date(), -1));
  const all = useCollection("commitments", { orderBy: "created_at", ascending: true });
  const [title, setTitle] = useState("");

  const todays = useMemo(() => all.items.filter((c) => c.date === today), [all.items, today]);
  const carry = useMemo(
    () => all.items.filter((c) => c.date === yesterday && !c.done && !todays.some((t) => t.title === c.title)),
    [all.items, yesterday, todays],
  );
  const suggestions = (profile?.experience === "islamic" ? COMMITMENT_SUGGESTIONS_ISLAMIC : COMMITMENT_SUGGESTIONS).filter(
    (s) => !todays.some((t) => t.title === s),
  );

  async function add(t: string) {
    const v = t.trim();
    if (!v) return;
    await all.create({ title: v, date: today, done: false, done_at: null });
    setTitle("");
  }

  const doneCount = todays.filter((t) => t.done).length;

  return (
    <div>
      <ErrorNote onRetry={all.refresh}>{all.error}</ErrorNote>
      <ul className="space-y-1">
        <AnimatePresence initial={false}>
          {todays.map((c) => (
            <motion.li
              key={c.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="group flex items-center gap-3 rounded-xl py-1.5"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={c.done}
                aria-label={c.title}
                onClick={() => all.update(c.id, { done: !c.done, done_at: c.done ? null : new Date().toISOString() })}
                className={cx(
                  "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                  c.done ? "border-forest bg-forest text-ivory" : "border-sage hover:border-forest",
                )}
              >
                {c.done && <Check size={13} strokeWidth={2.5} />}
              </button>
              <span className={cx("flex-1 text-[15px] transition-colors duration-300", c.done ? "text-stone line-through decoration-sand" : "text-ink")}>
                {c.title}
              </span>
              <IconButton label={`Remove ${c.title}`} onClick={() => all.remove(c.id)} className="h-7 w-7 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100">
                <X size={14} />
              </IconButton>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {!all.loading && todays.length === 0 && (
        <p className="mb-2 text-sm leading-relaxed text-muted">A few honest commitments are better than a long list. What will you actually do today?</p>
      )}

      <form className="mt-3 flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); void add(title); }}>
        <label htmlFor="new-commitment" className="sr-only">Add a commitment</label>
        <input id="new-commitment" className="field-quiet flex-1 text-[15px]" placeholder="Add a commitment…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        <Button type="submit" size="sm" variant="ghost" disabled={!title.trim()}>Add</Button>
      </form>

      {todays.length >= 5 && <p className="mt-3 text-[12px] text-muted">That’s a full day. Consider keeping the rest for tomorrow.</p>}

      {carry.length > 0 && (
        <div className="mt-5 rounded-2xl bg-sand-soft/60 px-4 py-3 text-[13px] text-muted">
          {carry.length === 1 ? "One commitment" : `${carry.length} commitments`} from yesterday remained open.{" "}
          <button
            className="text-forest underline underline-offset-4"
            onClick={async () => { for (const c of carry) await all.create({ title: c.title, date: today, done: false, done_at: null }); }}
          >
            Bring forward
          </button>
          <span className="mx-1">·</span>
          <span>or simply let them go.</span>
        </div>
      )}

      {todays.length < 3 && suggestions.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {suggestions.slice(0, 4).map((s) => (
            <Chip key={s} onClick={() => add(s)} className="text-muted">+ {s}</Chip>
          ))}
        </div>
      )}

      {todays.length > 0 && doneCount === todays.length && (
        <p className="mt-5 font-serif text-[15px] italic text-forest">Everything you set out to do is done. Rest is part of the work too.</p>
      )}
    </div>
  );
}
