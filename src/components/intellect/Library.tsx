"use client";

import { ArrowUpRight, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useCollection } from "@/lib/hooks";
import type { ResourceKind, SavedResource } from "@/lib/types";
import { Button, Chip, cx, EmptyState, ErrorNote, Loading } from "../ui";
import { RESOURCE_KINDS, RESOURCE_STATUS, ResourceForm } from "./ResourceForm";

export function Library() {
  const res = useCollection("saved_resources");
  const [kind, setKind] = useState<ResourceKind | "all">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<SavedResource | "new" | null>(null);

  const collections = useMemo(() => [...new Set(res.items.map((r) => r.collection).filter(Boolean) as string[])].sort(), [res.items]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return res.items.filter(
      (r) => (kind === "all" || r.kind === kind) && (!s || [r.title, r.author, r.note, r.collection].some((x) => x?.toLowerCase().includes(s))),
    );
  }, [res.items, kind, q]);
  const groups = useMemo(() => {
    const m = new Map<string, SavedResource[]>();
    for (const r of filtered) {
      const k = r.collection ?? "Unsorted";
      m.set(k, [...(m.get(k) ?? []), r]);
    }
    return [...m.entries()].sort(([a], [b]) => (a === "Unsorted" ? 1 : b === "Unsorted" ? -1 : a.localeCompare(b)));
  }, [filtered]);

  if (res.loading) return <Loading label="" />;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
          <Chip selected={kind === "all"} onClick={() => setKind("all")}>All</Chip>
          {RESOURCE_KINDS.map((k) => <Chip key={k.id} selected={kind === k.id} onClick={() => setKind(k.id)} className="shrink-0">{k.label}s</Chip>)}
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1 md:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone" />
            <label htmlFor="lib-q" className="sr-only">Search library</label>
            <input id="lib-q" className="field !py-2.5 !pl-10 text-sm" placeholder="Search library" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button onClick={() => setEditing("new")}><Plus size={15} /> Add to library</Button>
        </div>
      </div>
      <ErrorNote onRetry={res.refresh}>{res.error}</ErrorNote>

      {res.items.length === 0 ? (
        <EmptyState title="Your library is waiting" action={<Button onClick={() => setEditing("new")}>Save your first resource</Button>}>
          Keep the books, papers, lectures, and quotations that have shaped your thinking — the ones worth returning to.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState title="Nothing matches">Try a different search or filter.</EmptyState>
      ) : (
        <div className="space-y-12">
          {groups.map(([name, items]) => (
            <section key={name}>
              <h3 className="mb-4 font-serif text-xl text-forest">{name} <span className="text-sm text-stone">· {items.length}</span></h3>
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((r) => (
                  <li key={r.id}>
                    <div className="card relative flex h-full w-full flex-col p-6 text-left transition-colors hover:border-sage">
                      <button onClick={() => setEditing(r)} className="absolute inset-0 rounded-[22px]" aria-label={`Edit ${r.title.slice(0, 60)}`} />
                      <span className="eyebrow">{RESOURCE_KINDS.find((k) => k.id === r.kind)?.label}</span>
                      {r.kind === "quote" ? (
                        <p className="mt-3 font-serif text-[1.15rem] italic leading-snug text-forest">“{r.title}”</p>
                      ) : (
                        <p className="mt-3 font-serif text-[1.2rem] leading-snug text-forest">{r.title}</p>
                      )}
                      {r.author && <p className="mt-1 text-sm text-muted">{r.kind === "quote" ? "— " : ""}{r.author}</p>}
                      {r.note && <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-ink/75">{r.note}</p>}
                      <span className="mt-auto flex items-center justify-between pt-4 text-[12px] text-muted">
                        {r.kind !== "quote" ? <span className={cx(r.status === "finished" && "text-forest")}>{RESOURCE_STATUS.find((s) => s.id === r.status)?.label}</span> : <span />}
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="relative z-10 inline-flex items-center gap-1 text-forest hover:underline">
                            Open <ArrowUpRight size={12} />
                          </a>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <ResourceForm
        open={editing !== null}
        initial={editing === "new" ? null : editing}
        collections={collections}
        onClose={() => setEditing(null)}
        onSave={async (d) => {
          if (editing === "new") await res.create(d);
          else if (editing) await res.update(editing.id, d);
          setEditing(null);
        }}
        onDelete={editing && editing !== "new" ? async () => { await res.remove(editing.id); setEditing(null); } : undefined}
      />
    </div>
  );
}
