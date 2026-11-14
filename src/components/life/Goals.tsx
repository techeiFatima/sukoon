"use client";

import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { GOAL_AREAS } from "@/content/prompts";
import { useCollection } from "@/lib/hooks";
import { uid } from "@/lib/store/local";
import type { GoalArea, PersonalGoal } from "@/lib/types";
import { Button, Chip, ConfirmDelete, cx, EmptyState, ErrorNote, IconButton, Label, Loading, Modal, TextArea } from "../ui";

export function Goals() {
  const goals = useCollection("personal_goals", { orderBy: "created_at", ascending: true });
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState<GoalArea>("personal");
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDone, setShowDone] = useState(false);

  if (goals.loading) return <Loading label="" />;
  const active = goals.items.filter((g) => g.status === "active");
  const closed = goals.items.filter((g) => g.status !== "active");

  return (
    <div>
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted">Meaningful goals, broken into steps small enough to begin today. Fewer is better.</p>
        <Button onClick={() => setOpen(true)}><Plus size={15} /> New goal</Button>
      </div>
      <ErrorNote onRetry={goals.refresh}>{goals.error}</ErrorNote>

      {active.length === 0 ? (
        <EmptyState title="No active goals" action={<Button variant="secondary" onClick={() => setOpen(true)}>Set a meaningful goal</Button>}>Start with one thing that would genuinely matter a year from now.</EmptyState>
      ) : (
        <div className="space-y-12">
          {GOAL_AREAS.filter((a) => active.some((g) => g.area === a.id)).map((a) => (
            <section key={a.id}>
              <h2 className="eyebrow mb-4">{a.label}</h2>
              <ul className="grid gap-5 md:grid-cols-2">
                {active.filter((g) => g.area === a.id).map((g) => (
                  <GoalCard key={g.id} goal={g} onUpdate={(p) => goals.update(g.id, p)} onDelete={() => goals.remove(g.id)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <div className="mt-14">
          <button className="text-sm text-muted hover:text-forest" onClick={() => setShowDone((s) => !s)}>{showDone ? "Hide" : "Show"} completed and released goals ({closed.length})</button>
          {showDone && (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {closed.map((g) => (
                <li key={g.id} className="flex items-center justify-between py-3.5">
                  <span className="font-serif text-lg text-forest">{g.title} <span className="font-sans text-[12px] text-muted">· {g.status === "complete" ? "completed" : "released"}</span></span>
                  <div className="flex gap-4">
                    <button className="text-[13px] text-muted hover:text-forest" onClick={() => goals.update(g.id, { status: "active" })}>Reopen</button>
                    <ConfirmDelete onConfirm={() => goals.remove(g.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="A meaningful goal">
        <form className="space-y-5" onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setBusy(true);
          const g = await goals.create({ area, title: title.trim(), why: why.trim() || null, steps: [], status: "active" });
          setBusy(false);
          if (g) { setOpen(false); setTitle(""); setWhy(""); }
        }}>
          <div className="flex flex-wrap gap-2">{GOAL_AREAS.map((a) => <Chip key={a.id} selected={area === a.id} onClick={() => setArea(a.id)}>{a.label}</Chip>)}</div>
          <div>
            <Label htmlFor="g-title">Goal</Label>
            <input id="g-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Memorise Surah Al-Mulk with its meaning" />
          </div>
          <div>
            <Label htmlFor="g-why" hint="Optional, but powerful">Why does this matter to you?</Label>
            <TextArea id="g-why" minRows={2} value={why} onChange={(e) => setWhy(e.target.value)} maxLength={600} />
          </div>
          <div className="flex justify-end"><Button type="submit" disabled={!title.trim()} loading={busy}>Create goal</Button></div>
        </form>
      </Modal>
    </div>
  );
}

function GoalCard({ goal, onUpdate, onDelete }: { goal: PersonalGoal; onUpdate: (p: Partial<PersonalGoal>) => void; onDelete: () => void }) {
  const [step, setStep] = useState("");
  const done = goal.steps.filter((s) => s.done).length;
  return (
    <li className="card flex flex-col p-7">
      <h3 className="text-[1.45rem] leading-tight text-forest">{goal.title}</h3>
      {goal.why && <p className="mt-2 text-sm italic leading-relaxed text-muted">{goal.why}</p>}
      <ul className="mt-5 space-y-1">
        {goal.steps.map((s) => (
          <li key={s.id} className="group flex items-center gap-3 py-1">
            <button role="checkbox" aria-checked={s.done} aria-label={s.title} onClick={() => onUpdate({ steps: goal.steps.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })}
              className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors", s.done ? "border-forest bg-forest text-ivory" : "border-sage hover:border-forest")}>
              {s.done && <Check size={12} strokeWidth={2.5} />}
            </button>
            <span className={cx("flex-1 text-[14px]", s.done ? "text-stone line-through decoration-sand" : "text-ink")}>{s.title}</span>
            <IconButton label={`Remove ${s.title}`} className="h-6 w-6 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100" onClick={() => onUpdate({ steps: goal.steps.filter((x) => x.id !== s.id) })}><X size={12} /></IconButton>
          </li>
        ))}
      </ul>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!step.trim()) return; onUpdate({ steps: [...goal.steps, { id: uid(), title: step.trim(), done: false }] }); setStep(""); }}>
        <label htmlFor={`st-${goal.id}`} className="sr-only">Add a step</label>
        <input id={`st-${goal.id}`} className="field-quiet flex-1 text-[14px]" placeholder={goal.steps.length ? "Add a step…" : "What’s a first step you could take this week?"} value={step} onChange={(e) => setStep(e.target.value)} maxLength={140} />
        <Button type="submit" variant="ghost" size="sm" disabled={!step.trim()}>Add</Button>
      </form>
      <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-[13px]">
        <span className="text-muted">{goal.steps.length ? `${done} of ${goal.steps.length} steps` : "No steps yet"}</span>
        <div className="flex gap-4">
          <button className="text-forest hover:underline" onClick={() => onUpdate({ status: "complete" })}>Complete</button>
          <button className="text-muted hover:text-forest" onClick={() => onUpdate({ status: "released" })} title="Let go of this goal without guilt">Release</button>
          <ConfirmDelete onConfirm={onDelete} />
        </div>
      </div>
    </li>
  );
}
