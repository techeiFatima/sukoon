"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Info, Pause, Play, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BOUNDARY_SUGGESTIONS } from "@/content/prompts";
import { formatRelative } from "@/lib/dates";
import { useCollection } from "@/lib/hooks";
import type { Boundary } from "@/lib/types";
import { Button, Card, Chip, ConfirmDelete, cx, ErrorNote, Label, Modal, SectionTitle, TextArea } from "../ui";

const TIMER_KEY = "sukoon:focus-timer";
interface TimerState {
  boundaryId: string | null;
  intention: string;
  minutes: number;
  endsAt: number | null; // running
  remainingMs: number; // when paused
  startedAt: number;
}

function loadTimer(): TimerState | null {
  try { const raw = localStorage.getItem(TIMER_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveTimer(t: TimerState | null) {
  try { if (t) localStorage.setItem(TIMER_KEY, JSON.stringify(t)); else localStorage.removeItem(TIMER_KEY); } catch { /* ignore */ }
}

export function Boundaries() {
  const boundaries = useCollection("boundaries", { orderBy: "created_at", ascending: true });
  const sessions = useCollection("focus_sessions");
  const [editing, setEditing] = useState<Boundary | "new" | null>(null);

  return (
    <div className="grid gap-14 lg:grid-cols-[1fr_1fr]">
      <section>
        <SectionTitle
          title="Your boundaries"
          hint="Personal agreements with yourself about technology."
          action={<Button size="sm" variant="secondary" onClick={() => setEditing("new")}>New</Button>}
        />
        <ErrorNote onRetry={boundaries.refresh}>{boundaries.error}</ErrorNote>
        <ul className="space-y-3">
          {boundaries.items.map((b) => (
            <li key={b.id} className={cx("card flex items-start gap-4 p-5 transition-opacity", !b.active && "opacity-60")}>
              <button
                role="switch"
                aria-checked={b.active}
                aria-label={`${b.title} ${b.active ? "active" : "paused"}`}
                onClick={() => boundaries.update(b.id, { active: !b.active })}
                className={cx("mt-1 h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors", b.active ? "bg-forest" : "bg-line")}
              >
                <span className={cx("block h-4 w-4 rounded-full bg-ivory shadow transition-transform", b.active && "translate-x-4")} />
              </button>
              <div className="flex-1">
                <p className="font-medium text-ink">{b.title}</p>
                {b.description && <p className="mt-1 text-sm leading-relaxed text-muted">{b.description}</p>}
              </div>
              <button className="text-[13px] text-muted hover:text-forest" onClick={() => setEditing(b)}>Edit</button>
            </li>
          ))}
        </ul>
        {!boundaries.loading && boundaries.items.length === 0 && (
          <div>
            <p className="mb-4 text-sm text-muted">Begin with one. Small boundaries kept are worth more than ambitious ones broken.</p>
            <div className="flex flex-wrap gap-2">
              {BOUNDARY_SUGGESTIONS.map((s) => (
                <Chip key={s.title} onClick={() => boundaries.create({ ...s, active: true })}>+ {s.title}</Chip>
              ))}
            </div>
          </div>
        )}
        <p className="mt-8 flex gap-2 text-[12px] leading-relaxed text-muted">
          <Info size={14} className="mt-0.5 shrink-0" />
          Sukoon doesn’t block other apps or websites — it has no access to your device. These boundaries are commitments you keep yourself, with a timer to help.
        </p>
      </section>

      <section>
        <FocusTimer boundaries={boundaries.items.filter((b) => b.active)} onComplete={sessions.create} />
        {sessions.items.length > 0 && (
          <div className="mt-10">
            <h3 className="eyebrow mb-4">Recent focus sessions</h3>
            <ul className="divide-y divide-line border-y border-line">
              {sessions.items.slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-start gap-4 py-3.5 text-sm">
                  <span className="w-20 shrink-0 text-muted">{formatRelative(s.created_at)}</span>
                  <div className="flex-1">
                    <p className="text-ink">{s.intention || "Focused time"} <span className="text-muted">· {s.actual_minutes} min</span></p>
                    {s.reflection && <p className="mt-1 text-muted">{s.reflection}</p>}
                  </div>
                  <ConfirmDelete onConfirm={() => sessions.remove(s.id)} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <BoundaryEditor
        value={editing}
        onClose={() => setEditing(null)}
        onSave={async (title, description) => {
          if (editing === "new") await boundaries.create({ title, description, active: true });
          else if (editing) await boundaries.update(editing.id, { title, description });
          setEditing(null);
        }}
        onDelete={editing && editing !== "new" ? async () => { await boundaries.remove(editing.id); setEditing(null); } : undefined}
      />
    </div>
  );
}

function BoundaryEditor({ value, onClose, onSave, onDelete }: { value: Boundary | "new" | null; onClose: () => void; onSave: (t: string, d: string | null) => void; onDelete?: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  useEffect(() => {
    if (value && value !== "new") { setTitle(value.title); setDesc(value.description ?? ""); }
    else { setTitle(""); setDesc(""); }
  }, [value]);
  return (
    <Modal open={value !== null} onClose={onClose} title={value === "new" ? "A new boundary" : "Edit boundary"}>
      <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) onSave(title.trim(), desc.trim() || null); }} className="space-y-5">
        <div>
          <Label htmlFor="b-title">Name</Label>
          <input id="b-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A quiet first hour" maxLength={80} />
        </div>
        <div>
          <Label htmlFor="b-desc" hint="Optional">What does it mean in practice?</Label>
          <TextArea id="b-desc" minRows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="No social media for the first hour after waking." maxLength={400} />
        </div>
        <div className="flex items-center justify-between pt-2">
          {onDelete ? <ConfirmDelete onConfirm={onDelete} /> : <span />}
          <Button type="submit" disabled={!title.trim()}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function FocusTimer({ boundaries, onComplete }: { boundaries: Boundary[]; onComplete: (row: { boundary_id: string | null; intention: string | null; planned_minutes: number; actual_minutes: number; reflection: string | null }) => Promise<unknown> }) {
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [minutes, setMinutes] = useState(25);
  const [intention, setIntention] = useState("");
  const [boundaryId, setBoundaryId] = useState<string | null>(null);
  const [finished, setFinished] = useState<{ t: TimerState; actual: number } | null>(null);
  const [reflection, setReflection] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setTimer(loadTimer()), []);
  useEffect(() => saveTimer(timer), [timer]);

  const running = Boolean(timer?.endsAt);
  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, [running]);

  const remaining = timer ? (timer.endsAt ? timer.endsAt - now : timer.remainingMs) : minutes * 60_000;
  const total = (timer?.minutes ?? minutes) * 60_000;
  const progress = 1 - Math.max(0, remaining) / total;

  useEffect(() => {
    if (timer?.endsAt && remaining <= 0) finish(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, timer]);

  function start() {
    setTimer({ boundaryId, intention: intention.trim(), minutes, endsAt: Date.now() + minutes * 60_000, remainingMs: minutes * 60_000, startedAt: Date.now() });
    setNow(Date.now());
  }
  function pause() {
    if (!timer?.endsAt) return;
    setTimer({ ...timer, endsAt: null, remainingMs: timer.endsAt - Date.now() });
  }
  function resume() {
    if (!timer) return;
    setTimer({ ...timer, endsAt: Date.now() + timer.remainingMs });
    setNow(Date.now());
  }
  function finish(t: TimerState) {
    const left = t.endsAt ? t.endsAt - Date.now() : t.remainingMs;
    const actual = Math.max(1, Math.round((t.minutes * 60_000 - Math.max(0, left)) / 60_000));
    setTimer(null);
    setFinished({ t, actual });
  }

  const R = 92;
  const C = 2 * Math.PI * R;
  const boundary = useMemo(() => boundaries.find((b) => b.id === (timer?.boundaryId ?? boundaryId)), [boundaries, timer, boundaryId]);

  return (
    <Card className="text-center">
      <h3 className="eyebrow mb-6">Focused time</h3>
      <div className="relative mx-auto h-56 w-56">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="100" cy="100" r={R} fill="none" stroke="#E5E0D4" strokeWidth="2" />
          <circle cx="100" cy="100" r={R} fill="none" stroke="#233F35" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - (timer ? progress : 0))} style={{ transition: "stroke-dashoffset 300ms linear" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-5xl tabular-nums text-forest" role="timer" aria-live="off">{fmt(remaining)}</span>
          {timer && <span className="mt-2 max-w-[10rem] truncate text-[12px] text-muted">{timer.intention || boundary?.title || (running ? "In focus" : "Paused")}</span>}
        </div>
      </div>

      {!timer ? (
        <div className="mx-auto mt-8 max-w-sm space-y-5 text-left">
          <div className="flex justify-center gap-2">
            {[15, 25, 45, 60].map((m) => <Chip key={m} selected={minutes === m} onClick={() => setMinutes(m)}>{m} min</Chip>)}
          </div>
          <div>
            <Label htmlFor="ft-int" hint="Optional">What is this time for?</Label>
            <input id="ft-int" className="field" value={intention} onChange={(e) => setIntention(e.target.value)} placeholder="Read chapter 3 of Strang" maxLength={80} />
          </div>
          {boundaries.length > 0 && (
            <div>
              <Label htmlFor="ft-b" hint="Optional">Boundary you’re keeping</Label>
              <select id="ft-b" className="field" value={boundaryId ?? ""} onChange={(e) => setBoundaryId(e.target.value || null)}>
                <option value="">None</option>
                {boundaries.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </div>
          )}
          <Button size="lg" className="w-full" onClick={start}><Play size={16} /> Begin</Button>
          <p className="text-center text-[12px] text-muted">Consider putting your phone in another room.</p>
        </div>
      ) : (
        <div className="mt-8 flex justify-center gap-3">
          {running ? <Button variant="secondary" onClick={pause}><Pause size={15} /> Pause</Button> : <Button variant="secondary" onClick={resume}><Play size={15} /> Resume</Button>}
          <Button variant="ghost" onClick={() => finish(timer)}><Square size={14} /> End now</Button>
        </div>
      )}

      <AnimatePresence>
        {finished && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-8 max-w-sm text-left">
            <p className="text-center font-serif text-xl text-forest">You gave {finished.actual} {finished.actual === 1 ? "minute" : "minutes"} of real attention.</p>
            <div className="mt-5">
              <Label htmlFor="ft-ref">How did that feel? What pulled at you?</Label>
              <TextArea id="ft-ref" minRows={2} value={reflection} onChange={(e) => setReflection(e.target.value)} maxLength={600} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="quiet" onClick={async () => { setSaving(true); await onComplete({ boundary_id: finished.t.boundaryId, intention: finished.t.intention || null, planned_minutes: finished.t.minutes, actual_minutes: finished.actual, reflection: null }); setSaving(false); setFinished(null); }}>Skip</Button>
              <Button loading={saving} onClick={async () => { setSaving(true); await onComplete({ boundary_id: finished.t.boundaryId, intention: finished.t.intention || null, planned_minutes: finished.t.minutes, actual_minutes: finished.actual, reflection: reflection.trim() || null }); setSaving(false); setReflection(""); setFinished(null); }}>Save</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
