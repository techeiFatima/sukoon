"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ATTENTION_CATEGORIES } from "@/content/prompts";
import { lastNDates, localDate } from "@/lib/dates";
import { useCollection } from "@/lib/hooks";
import type { AlignmentReflection, PersonalValue } from "@/lib/types";
import { Button, EmptyState, ErrorNote, Loading, SavedHint, TextArea } from "../ui";

/** Puts what someone values beside how their time has actually been spent. No scores. */
export function Alignment() {
  const values = useCollection("personal_values", { orderBy: "position", ascending: true });
  const align = useCollection("alignment_reflections");
  const checkins = useCollection("attention_checkins");
  const sessions = useCollection("focus_sessions");
  const offline = useCollection("offline_actions");

  const week = useMemo(() => new Set(lastNDates(7)), []);
  const mirror = useMemo(() => {
    const counts: Record<string, number> = {};
    checkins.items.filter((c) => week.has(c.date)).forEach((c) => c.categories.forEach((x) => (counts[x] = (counts[x] ?? 0) + 1)));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => ATTENTION_CATEGORIES.find((c) => c.id === k)?.label.toLowerCase() ?? k);
    const focusMin = sessions.items.filter((s) => week.has(localDate(new Date(s.created_at)))).reduce((a, s) => a + s.actual_minutes, 0);
    const off = offline.items.filter((o) => week.has(o.date)).length;
    return { top, focusMin, off, any: top.length > 0 || focusMin > 0 || off > 0 };
  }, [checkins.items, sessions.items, offline.items, week]);

  if (values.loading || align.loading) return <Loading label="" />;

  return (
    <div>
      <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-muted">
        Not a measure of your worth — a mirror. Place what you value beside how you have actually been spending your time, and look honestly at the space between them.
      </p>
      <ErrorNote onRetry={align.refresh}>{align.error || values.error}</ErrorNote>

      <section className="mb-12 rounded-[22px] bg-sand-soft/60 p-7">
        <h2 className="eyebrow mb-3">How you’ve spent this week, in your own words</h2>
        {mirror.any ? (
          <ul className="space-y-1.5 text-[15px] text-ink">
            {mirror.top.length > 0 && <li>Your check-ins mention {mirror.top.length > 1 ? `${mirror.top.slice(0, -1).join(", ")} and ${mirror.top.at(-1)}` : mirror.top[0]} most often.</li>}
            {mirror.focusMin > 0 && <li>You gave {mirror.focusMin} {mirror.focusMin === 1 ? "minute" : "minutes"} to focused, intentional time.</li>}
            {mirror.off > 0 && <li>You logged {mirror.off} meaningful offline {mirror.off === 1 ? "moment" : "moments"}.</li>}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            As you use <Link href="/mind" className="text-forest underline underline-offset-4">attention check-ins</Link> and focused time, a quiet summary will appear here to reflect against.
          </p>
        )}
      </section>

      {values.items.length === 0 ? (
        <EmptyState title="Name your values first">Alignment begins with knowing what you’re aligning to. Add values in the Values tab.</EmptyState>
      ) : (
        <div className="space-y-6">
          {values.items.map((v) => (
            <AlignmentRow key={v.id} value={v} row={align.items.find((a) => a.value_id === v.id) ?? null}
              onSave={async (patch, existing) => { if (existing) await align.update(existing.id, patch); else await align.create({ value_id: v.id, current_behavior: patch.current_behavior ?? null, small_change: patch.small_change ?? null }); }} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlignmentRow({ value, row, onSave }: { value: PersonalValue; row: AlignmentReflection | null; onSave: (p: Partial<AlignmentReflection>, existing: AlignmentReflection | null) => Promise<void> }) {
  const [behavior, setBehavior] = useState(row?.current_behavior ?? "");
  const [change, setChange] = useState(row?.small_change ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  useEffect(() => { setBehavior(row?.current_behavior ?? ""); setChange(row?.small_change ?? ""); }, [row?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = behavior !== (row?.current_behavior ?? "") || change !== (row?.small_change ?? "");

  return (
    <article className="card grid gap-0 overflow-hidden p-0 md:grid-cols-[0.8fr_1fr_1fr]">
      <div className="bg-forest p-7 text-ivory">
        <p className="text-[11px] uppercase tracking-[0.16em] text-sage">What I value</p>
        <h3 className="mt-3 text-[1.7rem]">{value.name}</h3>
        {value.meaning ? <p className="mt-2 text-sm leading-relaxed text-ivory/75">{value.meaning}</p> : <p className="mt-2 text-sm italic text-ivory/50">Describe what this means to you in the Values tab.</p>}
      </div>
      <div className="border-b border-line p-7 md:border-b-0 md:border-r">
        <label htmlFor={`b-${value.id}`} className="eyebrow mb-3 block">How I spend my time</label>
        <TextArea id={`b-${value.id}`} minRows={3} className="!border-transparent !bg-transparent !px-0 text-[15px] focus:!shadow-none" placeholder={`Honestly, how does ${value.name.toLowerCase()} show up in your week?`} value={behavior} onChange={(e) => setBehavior(e.target.value)} maxLength={1000} />
      </div>
      <div className="p-7">
        <label htmlFor={`c-${value.id}`} className="eyebrow mb-3 block">One small change</label>
        <TextArea id={`c-${value.id}`} minRows={3} className="!border-transparent !bg-transparent !px-0 text-[15px] focus:!shadow-none" placeholder="What small change would bring these closer together?" value={change} onChange={(e) => setChange(e.target.value)} maxLength={1000} />
        <div className="mt-3 flex items-center justify-end gap-3">
          <SavedHint state={state} />
          <Button size="sm" disabled={!dirty || (!behavior.trim() && !change.trim())} onClick={async () => {
            setState("saving");
            try { await onSave({ current_behavior: behavior.trim() || null, small_change: change.trim() || null }, row); setState("saved"); } catch { setState("error"); }
          }}>Save</Button>
        </div>
      </div>
    </article>
  );
}
