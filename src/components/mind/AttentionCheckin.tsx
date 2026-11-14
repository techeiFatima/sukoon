"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ATTENTION_CATEGORIES } from "@/content/prompts";
import { formatRelative, lastNDates, localDate, parseLocalDate } from "@/lib/dates";
import { useCollection } from "@/lib/hooks";
import { Button, Card, Chip, ConfirmDelete, EmptyState, ErrorNote, Loading, SectionTitle, TextArea } from "../ui";

const label = (id: string) => ATTENTION_CATEGORIES.find((c) => c.id === id)?.label ?? id;

export function AttentionCheckin() {
  const checkins = useCollection("attention_checkins");
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  async function save() {
    setBusy(true);
    const ok = await checkins.create({ date: localDate(), categories: selected, note: note.trim() || null });
    setBusy(false);
    if (ok) {
      setSelected([]);
      setNote("");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
      <section aria-labelledby="ci-h">
        <h2 id="ci-h" className="mb-2 font-serif text-[1.9rem] leading-tight text-forest">What has occupied your attention today?</h2>
        <p className="mb-7 text-sm text-muted">Choose what feels true. There are no right answers here — only noticing.</p>
        <div className="flex flex-wrap gap-2">
          {ATTENTION_CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              selected={selected.includes(c.id)}
              onClick={() => setSelected((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))}
            >
              {c.label}
            </Chip>
          ))}
        </div>
        <div className="mt-6">
          <TextArea
            aria-label="Optional note"
            minRows={3}
            placeholder="Anything you noticed? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
          />
        </div>
        <div className="mt-5 flex items-center gap-4">
          <Button onClick={save} disabled={!selected.length} loading={busy}>Save check-in</Button>
          {justSaved && <span role="status" className="text-sm text-forest">Noted. Thank you for pausing.</span>}
        </div>
        <ErrorNote onRetry={checkins.refresh}>{checkins.error}</ErrorNote>
      </section>

      <section aria-labelledby="week-h">
        {checkins.loading ? <Loading label="" /> : <WeeklyPattern items={checkins.items} />}
      </section>

      <section className="lg:col-span-2" aria-labelledby="recent-h">
        <SectionTitle title="Recent check-ins" />
        {checkins.items.length === 0 ? (
          <p className="text-sm text-muted">Your check-ins will appear here, visible only to you.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {checkins.items.slice(0, 12).map((c) => (
              <li key={c.id} className="flex flex-col gap-2 py-4 md:flex-row md:items-start md:gap-6">
                <span className="w-24 shrink-0 text-[13px] text-muted">{formatRelative(c.created_at)}</span>
                <div className="flex-1">
                  <p className="text-[15px] text-ink">{c.categories.map(label).join(" · ")}</p>
                  {c.note && <p className="mt-1 text-sm leading-relaxed text-muted">{c.note}</p>}
                </div>
                <ConfirmDelete onConfirm={() => checkins.remove(c.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function WeeklyPattern({ items }: { items: { date: string; categories: string[] }[] }) {
  const days = lastNDates(7);
  const { data, totals, used } = useMemo(() => {
    const totals: Record<string, number> = {};
    const data = days.map((d) => {
      const row: Record<string, number | string> = { day: parseLocalDate(d).toLocaleDateString(undefined, { weekday: "short" }) };
      for (const c of items.filter((i) => i.date === d)) {
        for (const cat of c.categories) {
          row[cat] = ((row[cat] as number) ?? 0) + 1;
          totals[cat] = (totals[cat] ?? 0) + 1;
        }
      }
      return row;
    });
    const used = ATTENTION_CATEGORIES.filter((c) => totals[c.id]);
    return { data, totals, used };
  }, [items, days]);

  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => label(k).toLowerCase());

  return (
    <Card className="h-full">
      <h2 id="week-h" className="eyebrow mb-2">This week, privately</h2>
      {used.length === 0 ? (
        <EmptyState title="A quiet week so far">
          After a few check-ins, you’ll see a gentle picture of where your attention has been going. It’s for noticing, never for scoring.
        </EmptyState>
      ) : (
        <>
          <p className="mb-6 font-serif text-xl leading-snug text-forest">
            Your attention has most often gone to {top.join(" and ")}.
          </p>
          <div className="h-56" role="img" aria-label={`Check-ins over the last seven days. Most frequent: ${top.join(", ")}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#63655e" }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#85877f" }} />
                <Tooltip
                  cursor={{ fill: "rgba(165,181,160,0.12)" }}
                  contentStyle={{ background: "#FBFAF6", border: "1px solid #E5E0D4", borderRadius: 12, fontSize: 12 }}
                />
                {used.map((c, i) => (
                  <Bar key={c.id} dataKey={c.id} name={c.label} stackId="a" fill={c.color} radius={i === used.length - 1 ? [5, 5, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {used.map((c) => (
              <li key={c.id} className="flex items-center gap-1.5 text-[12px] text-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                {c.label} <span className="text-stone">· {totals[c.id]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[13px] leading-relaxed text-muted">
            What, if anything, would you like to be different next week?
          </p>
        </>
      )}
    </Card>
  );
}
