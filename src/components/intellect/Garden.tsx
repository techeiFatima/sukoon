"use client";

import { Network, List, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCollection } from "@/lib/hooks";
import type { KnowledgeConnection, KnowledgeNote } from "@/lib/types";
import { Button, Chip, ConfirmDelete, cx, EmptyState, ErrorNote, Label, Loading, Modal, TextArea } from "../ui";
import { layoutGraph } from "./graph";

type View = "constellation" | "notes";

export function Garden() {
  const notes = useCollection("knowledge_notes");
  const conns = useCollection("knowledge_connections");
  const [view, setView] = useState<View>("constellation");
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [collection, setCollection] = useState<string | null>(null);
  const [open, setOpen] = useState<KnowledgeNote | "new" | null>(null);

  const tags = useMemo(() => [...new Set(notes.items.flatMap((n) => n.tags))].sort(), [notes.items]);
  const collections = useMemo(() => [...new Set(notes.items.map((n) => n.collection).filter(Boolean) as string[])].sort(), [notes.items]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return notes.items.filter(
      (n) =>
        (!tag || n.tags.includes(tag)) &&
        (!collection || n.collection === collection) &&
        (!s || n.title.toLowerCase().includes(s) || (n.body ?? "").toLowerCase().includes(s) || n.tags.some((t) => t.includes(s))),
    );
  }, [notes.items, q, tag, collection]);

  if (notes.loading || conns.loading) return <Loading label="" />;

  return (
    <div>
      <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-muted">
        Understanding lives in the connections between ideas. Plant a note, then link it to what it relates to — over time, a map of your own mind emerges.
      </p>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <div className="relative flex-1 md:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone" />
            <label htmlFor="g-q" className="sr-only">Search ideas</label>
            <input id="g-q" className="field !py-2.5 !pl-10 text-sm" placeholder="Search ideas" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex rounded-full border border-line bg-paper p-1" role="group" aria-label="View">
            <button aria-pressed={view === "constellation"} onClick={() => setView("constellation")} className={cx("rounded-full p-2", view === "constellation" ? "bg-forest text-ivory" : "text-muted")} title="Constellation"><Network size={15} /><span className="sr-only">Constellation view</span></button>
            <button aria-pressed={view === "notes"} onClick={() => setView("notes")} className={cx("rounded-full p-2", view === "notes" ? "bg-forest text-ivory" : "text-muted")} title="List"><List size={15} /><span className="sr-only">List view</span></button>
          </div>
        </div>
        <Button onClick={() => setOpen("new")}><Plus size={15} /> Plant an idea</Button>
      </div>

      {(tags.length > 0 || collections.length > 0) && (
        <div className="no-scrollbar -mx-1 mb-8 flex gap-2 overflow-x-auto px-1 py-1">
          {collections.map((c) => <Chip key={c} selected={collection === c} onClick={() => setCollection(collection === c ? null : c)} className="shrink-0">▤ {c}</Chip>)}
          {tags.map((t) => <Chip key={t} selected={tag === t} onClick={() => setTag(tag === t ? null : t)} className="shrink-0">#{t}</Chip>)}
        </div>
      )}
      <ErrorNote onRetry={notes.refresh}>{notes.error || conns.error}</ErrorNote>

      {notes.items.length === 0 ? (
        <EmptyState title="Plant your first idea" action={<Button onClick={() => setOpen("new")}>Plant an idea</Button>}>
          For example: <em>Linear algebra</em>, then <em>Neural networks</em>, then connect them — “is the language of”.
        </EmptyState>
      ) : view === "constellation" ? (
        <Constellation notes={filtered} conns={conns.items} onOpen={setOpen} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n) => {
            const degree = conns.items.filter((c) => c.from_note_id === n.id || c.to_note_id === n.id).length;
            return (
              <li key={n.id}>
                <button onClick={() => setOpen(n)} className="card h-full w-full p-6 text-left transition-colors hover:border-sage">
                  {n.collection && <p className="eyebrow mb-2">{n.collection}</p>}
                  <p className="font-serif text-[1.25rem] text-forest">{n.title}</p>
                  {n.body && <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink/75">{n.body}</p>}
                  <p className="mt-4 text-[12px] text-muted">{degree} connection{degree === 1 ? "" : "s"}{n.tags.length ? ` · ${n.tags.map((t) => `#${t}`).join(" ")}` : ""}</p>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && <li className="text-sm text-muted">Nothing matches.</li>}
        </ul>
      )}

      <NoteEditor
        value={open}
        notes={notes.items}
        conns={conns.items}
        collections={collections}
        onClose={() => setOpen(null)}
        onOpen={setOpen}
        onSave={async (d, id) => {
          if (id) return notes.update(id, d);
          const created = await notes.create(d);
          if (created) setOpen(created);
          return created;
        }}
        onDelete={async (id) => {
          await notes.remove(id);
          for (const c of conns.items.filter((c) => c.from_note_id === id || c.to_note_id === id)) await conns.remove(c.id);
          setOpen(null);
        }}
        onConnect={(from, to, label) => conns.create({ from_note_id: from, to_note_id: to, label })}
        onDisconnect={(id) => conns.remove(id)}
      />
    </div>
  );
}

function Constellation({ notes, conns, onOpen }: { notes: KnowledgeNote[]; conns: KnowledgeConnection[]; onOpen: (n: KnowledgeNote) => void }) {
  const ids = new Set(notes.map((n) => n.id));
  const edges = conns.filter((c) => ids.has(c.from_note_id) && ids.has(c.to_note_id)).map((c) => ({ from: c.from_note_id, to: c.to_note_id, label: c.label }));
  const key = notes.map((n) => n.id + n.title).join() + edges.map((e) => e.from + e.to).join();
  const nodes = useMemo(() => layoutGraph(notes.map((n) => ({ id: n.id, label: n.title })), edges), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const [hover, setHover] = useState<string | null>(null);
  const near = (id: string) => !hover || hover === id || edges.some((e) => (e.from === hover && e.to === id) || (e.to === hover && e.from === id));

  return (
    <div className="card overflow-hidden p-2">
      <svg viewBox="0 0 800 520" className="h-auto w-full" role="group" aria-label={`A map of ${nodes.length} ideas and ${edges.length} connections`}>
        {edges.map((e, i) => {
          const a = pos.get(e.from)!, b = pos.get(e.to)!;
          const active = hover && (e.from === hover || e.to === hover);
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={active ? "#233F35" : "#D9CEB9"} strokeWidth={active ? 1.4 : 1} />
              {active && e.label && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 5} textAnchor="middle" fontSize="11" fill="#63655e" fontStyle="italic" stroke="#FBFAF6" strokeWidth={4} paintOrder="stroke">{e.label}</text>}
            </g>
          );
        })}
        {nodes.map((n) => {
          const note = notes.find((x) => x.id === n.id)!;
          const r = 5 + Math.min(n.degree, 6) * 1.6;
          return (
            <g
              key={n.id}
              role="button"
              tabIndex={0}
              aria-label={`${n.label}, ${n.degree} connections`}
              onClick={() => onOpen(note)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(note))}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(n.id)}
              onBlur={() => setHover(null)}
              className="cursor-pointer outline-none"
              style={{ opacity: near(n.id) ? 1 : 0.3, transition: "opacity 200ms" }}
            >
              <circle cx={n.x} cy={n.y} r={r + 8} fill="transparent" />
              <circle cx={n.x} cy={n.y} r={r} fill={n.degree ? "#233F35" : "#A5B5A0"} stroke="#FBFAF6" strokeWidth="2" />
              <text x={n.x} y={n.y + r + 15} textAnchor="middle" fontSize="12.5" fill="#252923" fontFamily="var(--font-serif)" stroke="#FBFAF6" strokeWidth={4} strokeLinejoin="round" paintOrder="stroke">
                {n.label.length > 26 ? n.label.slice(0, 25) + "…" : n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

type NoteDraft = Omit<KnowledgeNote, "id" | "user_id" | "created_at" | "updated_at">;

function NoteEditor({
  value, notes, conns, collections, onClose, onOpen, onSave, onDelete, onConnect, onDisconnect,
}: {
  value: KnowledgeNote | "new" | null;
  notes: KnowledgeNote[];
  conns: KnowledgeConnection[];
  collections: string[];
  onClose: () => void;
  onOpen: (n: KnowledgeNote) => void;
  onSave: (d: NoteDraft, id?: string) => Promise<KnowledgeNote | null>;
  onDelete: (id: string) => Promise<void>;
  onConnect: (from: string, to: string, label: string | null) => Promise<unknown>;
  onDisconnect: (id: string) => Promise<unknown>;
}) {
  const existing = value && value !== "new" ? value : null;
  const [d, setD] = useState<NoteDraft>({ title: "", body: "", tags: [], collection: null, journey_id: null });
  const [tagInput, setTagInput] = useState("");
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (existing) setD({ title: existing.title, body: existing.body ?? "", tags: existing.tags, collection: existing.collection, journey_id: existing.journey_id });
    else if (value === "new") setD({ title: "", body: "", tags: [], collection: null, journey_id: null });
    setTarget(""); setLabel(""); setTagInput(""); setDirty(false);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const p = (x: Partial<NoteDraft>) => { setD((s) => ({ ...s, ...x })); setDirty(true); };
  const links = existing ? conns.filter((c) => c.from_note_id === existing.id || c.to_note_id === existing.id) : [];
  const linkedIds = new Set(links.map((c) => (c.from_note_id === existing?.id ? c.to_note_id : c.from_note_id)));
  const candidates = notes.filter((n) => n.id !== existing?.id && !linkedIds.has(n.id));

  async function save() {
    if (!d.title.trim()) return null;
    setBusy(true);
    const r = await onSave({ ...d, title: d.title.trim(), body: d.body?.trim() || null, collection: d.collection?.trim() || null }, existing?.id);
    setBusy(false);
    setDirty(false);
    return r;
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
    if (t && !d.tags.includes(t)) p({ tags: [...d.tags, t] });
    setTagInput("");
  }

  return (
    <Modal open={value !== null} onClose={onClose} title={existing ? "Idea" : "Plant an idea"} wide>
      <div className="space-y-5">
        <div>
          <Label htmlFor="n-title">Idea</Label>
          <input id="n-title" className="field font-serif text-xl" value={d.title} onChange={(e) => p({ title: e.target.value })} placeholder="Linear algebra" maxLength={120} />
        </div>
        <div>
          <Label htmlFor="n-body" hint="In your own words">Understanding</Label>
          <TextArea id="n-body" minRows={4} value={d.body ?? ""} onChange={(e) => p({ body: e.target.value })} placeholder="What is it, and why does it matter to you?" maxLength={8000} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="n-col" hint="Optional">Collection</Label>
            <input id="n-col" list="n-cols" className="field" value={d.collection ?? ""} onChange={(e) => p({ collection: e.target.value || null })} placeholder="Mathematics" maxLength={60} />
            <datalist id="n-cols">{collections.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <Label htmlFor="n-tag" hint="Press Enter">Tags</Label>
            <input id="n-tag" className="field" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} onBlur={addTag} placeholder="ai" maxLength={30} />
          </div>
        </div>
        {d.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">{d.tags.map((t) => <Chip key={t} removable onRemove={() => p({ tags: d.tags.filter((x) => x !== t) })}>#{t}</Chip>)}</div>
        )}

        <div className="flex items-center justify-between">
          {existing ? <ConfirmDelete onConfirm={() => onDelete(existing.id)} /> : <span />}
          <Button onClick={save} disabled={!d.title.trim() || (existing !== null && !dirty)} loading={busy}>{existing ? (dirty ? "Save changes" : "Saved") : "Plant"}</Button>
        </div>

        {existing && (
          <section className="border-t border-line pt-6" aria-labelledby="conn-h">
            <h3 id="conn-h" className="eyebrow mb-4">Connected ideas</h3>
            {links.length === 0 && <p className="mb-4 text-sm text-muted">Not yet connected. What does this idea relate to?</p>}
            <ul className="mb-5 space-y-2">
              {links.map((c) => {
                const otherId = c.from_note_id === existing.id ? c.to_note_id : c.from_note_id;
                const other = notes.find((n) => n.id === otherId);
                if (!other) return null;
                const outgoing = c.from_note_id === existing.id;
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-sage-soft/40 px-4 py-2.5">
                    <button className="text-left text-sm" onClick={() => onOpen(other)}>
                      <span className="text-muted">{outgoing ? "→" : "←"} {c.label && <em className="mr-1">{c.label}</em>}</span>
                      <span className="font-serif text-[15px] text-forest">{other.title}</span>
                    </button>
                    <button aria-label={`Disconnect ${other.title}`} className="text-muted hover:text-clay" onClick={() => onDisconnect(c.id)}><X size={14} /></button>
                  </li>
                );
              })}
            </ul>
            {candidates.length > 0 ? (
              <form
                className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                onSubmit={async (e) => { e.preventDefault(); if (!target) return; await onConnect(existing.id, target, label.trim() || null); setTarget(""); setLabel(""); }}
              >
                <label className="sr-only" htmlFor="c-target">Connect to</label>
                <select id="c-target" className="field" value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="">Connect to…</option>
                  {candidates.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
                </select>
                <label className="sr-only" htmlFor="c-label">Relationship (optional)</label>
                <input id="c-label" className="field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. is the foundation of" maxLength={60} />
                <Button type="submit" variant="secondary" disabled={!target}>Connect</Button>
              </form>
            ) : (
              <p className="text-sm text-muted">Plant more ideas to connect them here.</p>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}
