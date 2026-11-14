"use client";

import { ChevronLeft, ChevronRight, Lock, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { JOURNAL_PROMPTS } from "@/content/prompts";
import { formatLongDate, localDate, parseLocalDate } from "@/lib/dates";
import { useCollection } from "@/lib/hooks";
import type { Reflection } from "@/lib/types";
import { Button, Chip, ConfirmDelete, cx, EmptyState, ErrorNote, Loading, TextArea } from "../ui";

/** Private journal: a calendar of past reflections plus a writing surface. */
export function Journal() {
  const entries = useCollection("reflections", { eq: { kind: "journal" } });
  const daily = useCollection("reflections", { eq: { kind: "daily" } });
  const [selectedDate, setSelectedDate] = useState(localDate());
  const [prompt, setPrompt] = useState(JOURNAL_PROMPTS[0]);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<Reflection | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const all = useMemo(() => [...entries.items, ...daily.items], [entries.items, daily.items]);
  const datesWithEntries = useMemo(() => new Set(all.map((e) => e.date)), [all]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return all.filter((e) => e.body.toLowerCase().includes(q) || (e.prompt ?? "").toLowerCase().includes(q));
    return all.filter((e) => e.date === selectedDate);
  }, [all, selectedDate, query]);

  async function save() {
    if (!body.trim()) return;
    setBusy(true);
    if (editing) {
      await (editing.kind === "daily" ? daily : entries).update(editing.id, { body: body.trim() });
    } else {
      await entries.create({ kind: "journal", date: selectedDate, prompt, body: body.trim(), context: null });
    }
    setBusy(false);
    setBody("");
    setEditing(null);
  }

  if (entries.loading || daily.loading) return <Loading label="" />;
  const isToday = selectedDate === localDate();

  return (
    <div className="grid gap-12 lg:grid-cols-[320px_1fr] lg:gap-16">
      <aside>
        <Calendar selected={selectedDate} marked={datesWithEntries} onSelect={(d) => { setSelectedDate(d); setQuery(""); }} />
        <div className="relative mt-8">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone" />
          <label htmlFor="j-search" className="sr-only">Search your reflections</label>
          <input id="j-search" className="field !pl-10 text-sm" placeholder="Search your reflections" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <p className="mt-6 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
          <Lock size={13} className="mt-0.5 shrink-0" /> Your journal is private. It is never shared, never used for recommendations, and never sent to AI.
        </p>
      </aside>

      <div>
        <ErrorNote onRetry={entries.refresh}>{entries.error || daily.error}</ErrorNote>
        {!query && (
          <section className="card mb-12 p-7 md:p-9" aria-labelledby="j-write">
            <p className="eyebrow mb-2" id="j-write">{editing ? "Editing" : isToday ? "Today" : formatLongDate(parseLocalDate(selectedDate))}</p>
            {!editing && (
              <div className="no-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 py-1">
                {JOURNAL_PROMPTS.map((p) => <Chip key={p} selected={prompt === p} onClick={() => setPrompt(p)} className="shrink-0">{p}</Chip>)}
              </div>
            )}
            <p className="mb-4 font-serif text-[1.55rem] leading-snug text-forest">{editing?.prompt ?? prompt}</p>
            <TextArea aria-label={editing?.prompt ?? prompt} minRows={6} className="!border-transparent !bg-transparent !px-0 text-[15.5px] focus:!shadow-none" placeholder="Write honestly. Be kind to yourself." value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="mt-3 flex items-center justify-end gap-2 border-t border-line pt-4">
              {editing && <Button variant="quiet" onClick={() => { setEditing(null); setBody(""); }}>Cancel</Button>}
              <Button onClick={save} disabled={!body.trim()} loading={busy}>{editing ? "Save changes" : "Keep this reflection"}</Button>
            </div>
          </section>
        )}

        <h3 className="eyebrow mb-5">{query ? `${shown.length} result${shown.length === 1 ? "" : "s"}` : isToday ? "Written today" : "Written this day"}</h3>
        {shown.length === 0 ? (
          <EmptyState title={query ? "Nothing matches that" : "A blank page"}>
            {query ? "Try another word." : "Nothing written on this day. That’s alright — reflection isn’t a streak."}
          </EmptyState>
        ) : (
          <ul className="space-y-8">
            {shown.map((e) => (
              <li key={e.id} className="border-l-2 border-sand pl-6">
                <p className="text-[12px] text-muted">{formatLongDate(parseLocalDate(e.date))}{e.kind === "daily" && " · from Today"}</p>
                {e.prompt && <p className="mt-1 font-serif text-lg text-forest">{e.prompt}</p>}
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{e.body}</p>
                <div className="mt-3 flex gap-5">
                  <button className="text-[13px] text-muted hover:text-forest" onClick={() => { setEditing(e); setBody(e.body); setQuery(""); setSelectedDate(e.date); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                  <ConfirmDelete onConfirm={() => (e.kind === "daily" ? daily : entries).remove(e.id)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Calendar({ selected, marked, onSelect }: { selected: string; marked: Set<string>; onSelect: (d: string) => void }) {
  const sel = parseLocalDate(selected);
  const [view, setView] = useState(new Date(sel.getFullYear(), sel.getMonth(), 1));
  const today = localDate();
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthLabel = view.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <button aria-label="Previous month" className="rounded-full p-1.5 text-muted hover:bg-sage-soft" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
        <p className="font-serif text-lg text-forest" aria-live="polite">{monthLabel}</p>
        <button aria-label="Next month" className="rounded-full p-1.5 text-muted hover:bg-sage-soft" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-stone" aria-hidden>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const ds = localDate(new Date(view.getFullYear(), view.getMonth(), d));
          const isSel = ds === selected;
          const future = ds > today;
          return (
            <button
              key={i}
              disabled={future}
              onClick={() => onSelect(ds)}
              aria-label={`${parseLocalDate(ds).toLocaleDateString(undefined, { month: "long", day: "numeric" })}${marked.has(ds) ? ", has reflections" : ""}`}
              aria-pressed={isSel}
              className={cx(
                "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[13px] transition-colors",
                isSel ? "bg-forest text-ivory" : ds === today ? "text-forest ring-1 ring-sage" : "text-ink hover:bg-sage-soft",
                future && "pointer-events-none text-line",
              )}
            >
              {d}
              {marked.has(ds) && <span className={cx("absolute bottom-1 h-1 w-1 rounded-full", isSel ? "bg-sand" : "bg-sage")} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
