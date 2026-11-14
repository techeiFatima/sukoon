"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useCollection } from "@/lib/hooks";
import { Button, Chip, EmptyState, ErrorNote, Label, Loading, Modal, TextArea } from "../ui";

const EXAMPLES = ["Learn linear algebra", "Understand artificial intelligence", "Study Islamic philosophy", "Learn Python", "Explore neuroscience", "Read classical literature"];

export function Progress({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Topics explored">
        <div className="h-full rounded-full bg-forest transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[12px] text-muted">{total ? `${done} of ${total} topics explored` : "No topics mapped yet"}</p>
    </div>
  );
}

export function Journeys() {
  const journeys = useCollection("learning_journeys", { orderBy: "updated_at" });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [current, setCurrent] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (journeys.loading) return <Loading label="" />;
  const active = journeys.items.filter((j) => j.status !== "complete");
  const done = journeys.items.filter((j) => j.status === "complete");

  return (
    <div>
      <ErrorNote onRetry={journeys.refresh}>{journeys.error}</ErrorNote>
      {journeys.items.length === 0 ? (
        <EmptyState title="What do you want to understand deeply?" action={<Button onClick={() => setOpen(true)}>Begin a learning journey</Button>}>
          A journey is a commitment to one subject: what you want to understand, where you are now, and the path between.
        </EmptyState>
      ) : (
        <>
          <div className="mb-6 flex justify-end"><Button onClick={() => setOpen(true)}><Plus size={15} /> New journey</Button></div>
          <ul className="grid gap-5 md:grid-cols-2">
            {active.map((j) => (
              <li key={j.id}>
                <Link href={`/intellect/journeys/${j.id}`} className="card flex h-full flex-col p-7 transition-colors hover:border-sage">
                  <span className="eyebrow">{j.status === "paused" ? "Paused" : "In progress"}</span>
                  <h3 className="mt-3 text-[1.6rem] leading-tight text-forest">{j.title}</h3>
                  {j.objective && <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{j.objective}</p>}
                  <div className="mt-6"><Progress done={j.topics.filter((t) => t.done).length} total={j.topics.length} /></div>
                </Link>
              </li>
            ))}
          </ul>
          {done.length > 0 && (
            <section className="mt-14">
              <h3 className="eyebrow mb-4">Completed journeys</h3>
              <ul className="divide-y divide-line border-y border-line">
                {done.map((j) => (
                  <li key={j.id}><Link href={`/intellect/journeys/${j.id}`} className="block py-4 font-serif text-lg text-forest hover:underline">{j.title}</Link></li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="A new learning journey">
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!title.trim()) return;
            setBusy(true);
            const j = await journeys.create({ title: title.trim(), objective: objective.trim() || null, current_understanding: current.trim() || null, topics: [], status: "active" });
            setBusy(false);
            if (j) { setOpen(false); setTitle(""); setObjective(""); setCurrent(""); router.push(`/intellect/journeys/${j.id}`); }
          }}
        >
          <div>
            <Label htmlFor="j-title">What do you want to learn?</Label>
            <input id="j-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Understand artificial intelligence" />
            <div className="mt-3 flex flex-wrap gap-2">{EXAMPLES.map((x) => <Chip key={x} onClick={() => setTitle(x)} className="text-muted">{x}</Chip>)}</div>
          </div>
          <div>
            <Label htmlFor="j-obj" hint="Optional">Learning objective — what will you be able to do or explain?</Label>
            <TextArea id="j-obj" minRows={2} value={objective} onChange={(e) => setObjective(e.target.value)} maxLength={600} placeholder="Explain how a neural network learns, from the mathematics up." />
          </div>
          <div>
            <Label htmlFor="j-cur" hint="Optional">Where are you starting from?</Label>
            <TextArea id="j-cur" minRows={2} value={current} onChange={(e) => setCurrent(e.target.value)} maxLength={600} placeholder="I know basic calculus and some Python." />
          </div>
          <div className="flex justify-end"><Button type="submit" disabled={!title.trim()} loading={busy}>Begin</Button></div>
        </form>
      </Modal>
    </div>
  );
}
