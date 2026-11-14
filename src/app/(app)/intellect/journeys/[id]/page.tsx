"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Plus, X } from "lucide-react";
import { useStore } from "@/lib/app-context";
import { formatRelative, localDate } from "@/lib/dates";
import { useCollection } from "@/lib/hooks";
import { uid } from "@/lib/store/local";
import type { JourneyStatus, LearningJourney, SavedResource } from "@/lib/types";
import { Progress } from "@/components/intellect/Journeys";
import { RESOURCE_KINDS, ResourceForm } from "@/components/intellect/ResourceForm";
import { Button, Chip, ConfirmDelete, cx, EmptyState, ErrorNote, IconButton, Loading, TextArea } from "@/components/ui";

const LEARNING_PROMPT = "What did you understand today that you didn’t understand yesterday?";

export default function JourneyPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const router = useRouter();
  const journeys = useCollection("learning_journeys");
  const j = journeys.items.find((x) => x.id === id);

  if (journeys.loading) return <Loading />;
  if (!j) return <EmptyState title="This journey isn’t here" action={<Link href="/intellect" className="text-forest underline underline-offset-4">Back to Intellect</Link>} />;

  const save = (patch: Partial<LearningJourney>) => journeys.update(j.id, patch);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/intellect" className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted hover:text-forest"><ArrowLeft size={15} /> Learning journeys</Link>
      <ErrorNote>{journeys.error}</ErrorNote>
      <header className="mb-12">
        <p className="eyebrow mb-3">Learning journey</p>
        <EditableTitle value={j.title} onSave={(title) => save({ title })} />
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {(["active", "paused", "complete"] as JourneyStatus[]).map((s) => (
            <Chip key={s} selected={j.status === s} onClick={() => save({ status: s })}>{s === "active" ? "In progress" : s === "paused" ? "Paused" : "Complete"}</Chip>
          ))}
        </div>
      </header>

      <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-14">
          <div className="grid gap-8 md:grid-cols-2">
            <FieldBlock label="Objective" placeholder="What will you be able to do or explain?" value={j.objective} onSave={(objective) => save({ objective })} />
            <FieldBlock label="Current understanding" placeholder="Where are you now? Be honest — it helps." value={j.current_understanding} onSave={(current_understanding) => save({ current_understanding })} />
          </div>
          <Topics journey={j} onSave={save} />
          <LearningReflections journeyId={j.id} />
        </div>
        <div className="space-y-14">
          <Resources journeyId={j.id} />
          <JourneyNotes journeyId={j.id} journeyTitle={j.title} />
          <div className="border-t border-line pt-6">
            <ConfirmDelete label="Delete this journey" onConfirm={async () => {
              const notes = await store.list("knowledge_notes", { eq: { journey_id: j.id } });
              for (const n of notes) await store.update("knowledge_notes", n.id, { journey_id: null });
              const res = await store.list("saved_resources", { eq: { journey_id: j.id } });
              for (const r of res) await store.update("saved_resources", r.id, { journey_id: null });
              await journeys.remove(j.id);
              router.push("/intellect");
            }} />
            <p className="mt-2 text-[12px] text-muted">Your notes and resources will stay in your garden and library.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input
      aria-label="Journey title"
      className="w-full bg-transparent font-serif text-[2.4rem] leading-tight text-forest focus:outline-none md:text-[3rem]"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v.trim() && v !== value && onSave(v.trim())}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      maxLength={120}
    />
  );
}

function FieldBlock({ label, value, placeholder, onSave }: { label: string; value: string | null; placeholder: string; onSave: (v: string | null) => void }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  const id = `fb-${label.replace(/\s/g, "")}`;
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-3 block">{label}</label>
      <TextArea id={id} minRows={3} className="text-[15px]" value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={() => v !== (value ?? "") && onSave(v.trim() || null)} maxLength={1500} />
    </div>
  );
}

function Topics({ journey, onSave }: { journey: LearningJourney; onSave: (p: Partial<LearningJourney>) => void }) {
  const [t, setT] = useState("");
  const topics = journey.topics;
  return (
    <section aria-labelledby="topics-h">
      <h2 id="topics-h" className="mb-2 font-serif text-[1.6rem] text-forest">Topics to explore</h2>
      <div className="mb-5"><Progress done={topics.filter((x) => x.done).length} total={topics.length} /></div>
      <ol className="space-y-1">
        {topics.map((topic, i) => (
          <li key={topic.id} className="group flex items-center gap-3 py-1.5">
            <button
              role="checkbox"
              aria-checked={topic.done}
              aria-label={topic.title}
              onClick={() => onSave({ topics: topics.map((x) => (x.id === topic.id ? { ...x, done: !x.done } : x)) })}
              className={cx("flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border transition-colors", topic.done ? "border-forest bg-forest text-ivory" : "border-sage hover:border-forest")}
            >
              {topic.done && <Check size={13} strokeWidth={2.5} />}
            </button>
            <span className="w-6 text-[12px] tabular-nums text-stone">{i + 1}.</span>
            <span className={cx("flex-1 text-[15px]", topic.done ? "text-stone line-through decoration-sand" : "text-ink")}>{topic.title}</span>
            <IconButton label={`Remove ${topic.title}`} className="h-7 w-7 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100" onClick={() => onSave({ topics: topics.filter((x) => x.id !== topic.id) })}><X size={14} /></IconButton>
          </li>
        ))}
      </ol>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!t.trim()) return; onSave({ topics: [...topics, { id: uid(), title: t.trim(), done: false }] }); setT(""); }}>
        <label htmlFor="new-topic" className="sr-only">Add a topic</label>
        <input id="new-topic" className="field-quiet flex-1" placeholder={topics.length ? "Add a topic…" : "Map the path: e.g. Vectors, Matrices, Eigenvalues…"} value={t} onChange={(e) => setT(e.target.value)} maxLength={120} />
        <Button type="submit" variant="ghost" size="sm" disabled={!t.trim()}>Add</Button>
      </form>
    </section>
  );
}

function LearningReflections({ journeyId }: { journeyId: string }) {
  const refl = useCollection("reflections", { eq: { kind: "learning", context: journeyId } });
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section aria-labelledby="lr-h" className="card p-7 md:p-9">
      <h2 id="lr-h" className="eyebrow mb-4">After a learning session</h2>
      <p className="mb-5 font-serif text-[1.45rem] leading-snug text-forest">{LEARNING_PROMPT}</p>
      <TextArea aria-label={LEARNING_PROMPT} minRows={4} className="text-[15px]" placeholder="Explain it in your own words, as if to a friend. Where you get stuck is where to look next." value={body} onChange={(e) => setBody(e.target.value)} maxLength={6000} />
      <div className="mt-4 flex justify-end">
        <Button disabled={!body.trim()} loading={busy} onClick={async () => {
          setBusy(true);
          const ok = await refl.create({ kind: "learning", date: localDate(), prompt: LEARNING_PROMPT, body: body.trim(), context: journeyId });
          setBusy(false);
          if (ok) setBody("");
        }}>Keep this understanding</Button>
      </div>
      <ErrorNote>{refl.error}</ErrorNote>
      {refl.items.length > 0 && (
        <ul className="mt-8 space-y-6 border-t border-line pt-6">
          {refl.items.map((r) => (
            <li key={r.id}>
              <p className="text-[12px] text-muted">{formatRelative(r.created_at)}</p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{r.body}</p>
              <ConfirmDelete className="mt-2" onConfirm={() => refl.remove(r.id)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Resources({ journeyId }: { journeyId: string }) {
  const res = useCollection("saved_resources", { eq: { journey_id: journeyId } });
  const [editing, setEditing] = useState<SavedResource | "new" | null>(null);
  return (
    <section aria-labelledby="res-h">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="res-h" className="font-serif text-[1.6rem] text-forest">Resources</h2>
        <Button size="sm" variant="secondary" onClick={() => setEditing("new")}><Plus size={14} /> Add</Button>
      </div>
      {res.items.length === 0 ? (
        <p className="text-sm text-muted">The books, lectures, and papers for this journey. Choose a few good ones rather than many.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {res.items.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 py-3.5">
              <button className="text-left" onClick={() => setEditing(r)}>
                <span className="eyebrow">{RESOURCE_KINDS.find((k) => k.id === r.kind)?.label}</span>
                <span className={cx("block font-serif text-[1.05rem] text-forest", r.status === "finished" && "text-muted line-through decoration-sand")}>{r.title}</span>
                {r.author && <span className="text-[13px] text-muted">{r.author}</span>}
              </button>
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${r.title}`} className="mt-1 text-forest"><ArrowUpRight size={15} /></a>}
            </li>
          ))}
        </ul>
      )}
      <ResourceForm
        open={editing !== null}
        initial={editing === "new" ? null : editing}
        journeyId={journeyId}
        collections={[]}
        onClose={() => setEditing(null)}
        onSave={async (d) => { if (editing === "new") await res.create({ ...d, journey_id: journeyId }); else if (editing) await res.update(editing.id, d); setEditing(null); }}
        onDelete={editing && editing !== "new" ? async () => { await res.remove(editing.id); setEditing(null); } : undefined}
      />
    </section>
  );
}

function JourneyNotes({ journeyId, journeyTitle }: { journeyId: string; journeyTitle: string }) {
  const notes = useCollection("knowledge_notes", { eq: { journey_id: journeyId } });
  const [title, setTitle] = useState("");
  const sorted = useMemo(() => notes.items, [notes.items]);
  return (
    <section aria-labelledby="jn-h">
      <h2 id="jn-h" className="mb-2 font-serif text-[1.6rem] text-forest">Ideas</h2>
      <p className="mb-4 text-sm text-muted">Ideas you plant here also grow in your <Link href="/intellect?tab=garden" className="text-forest underline underline-offset-4">knowledge garden</Link>, where you can connect them.</p>
      <ul className="mb-3 flex flex-wrap gap-2">
        {sorted.map((n) => <li key={n.id}><Chip>{n.title}</Chip></li>)}
      </ul>
      <form className="flex gap-2" onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        await notes.create({ title: title.trim(), body: null, tags: [], collection: journeyTitle.slice(0, 60), journey_id: journeyId });
        setTitle("");
      }}>
        <label htmlFor="jn-new" className="sr-only">Plant an idea</label>
        <input id="jn-new" className="field-quiet flex-1" placeholder="Plant an idea…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        <Button type="submit" variant="ghost" size="sm" disabled={!title.trim()}>Plant</Button>
      </form>
    </section>
  );
}
