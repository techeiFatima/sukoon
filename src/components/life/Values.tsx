"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { VALUE_SUGGESTIONS } from "@/content/prompts";
import { useCollection } from "@/lib/hooks";
import type { PersonalValue } from "@/lib/types";
import { Button, Chip, ConfirmDelete, EmptyState, ErrorNote, IconButton, Loading, TextArea } from "../ui";

export function Values() {
  const values = useCollection("personal_values", { orderBy: "position", ascending: true });
  const [name, setName] = useState("");
  if (values.loading) return <Loading label="" />;
  const have = new Set(values.items.map((v) => v.name.toLowerCase()));

  async function add(n: string) {
    const v = n.trim();
    if (!v || have.has(v.toLowerCase())) return;
    await values.create({ name: v, meaning: null, position: (values.items.at(-1)?.position ?? -1) + 1 });
    setName("");
  }
  async function move(i: number, dir: -1 | 1) {
    const a = values.items[i], b = values.items[i + dir];
    if (!a || !b) return;
    await values.update(a.id, { position: b.position });
    await values.update(b.id, { position: a.position });
    await values.refresh();
  }

  return (
    <div className="max-w-3xl">
      <p className="mb-10 text-[15px] leading-relaxed text-muted">
        A value is only as real as what it looks like on an ordinary Tuesday. For each one, write what it means in practice — for you, not in general.
      </p>
      <ErrorNote onRetry={values.refresh}>{values.error}</ErrorNote>
      {values.items.length === 0 ? (
        <EmptyState title="What matters most to you?">Choose a few values below, or name your own.</EmptyState>
      ) : (
        <ol className="space-y-5">
          {values.items.map((v, i) => (
            <ValueRow key={v.id} v={v} index={i} count={values.items.length} onMove={move} onSave={(meaning) => values.update(v.id, { meaning })} onRename={(n) => values.update(v.id, { name: n })} onDelete={() => values.remove(v.id)} />
          ))}
        </ol>
      )}
      <div className="mt-10">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void add(name); }}>
          <label htmlFor="v-new" className="sr-only">Add a value</label>
          <input id="v-new" className="field-quiet flex-1" placeholder="Name a value…" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          <Button type="submit" variant="ghost" size="sm" disabled={!name.trim()}>Add</Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {VALUE_SUGGESTIONS.filter((s) => !have.has(s.toLowerCase())).slice(0, 10).map((s) => <Chip key={s} onClick={() => add(s)} className="text-muted">+ {s}</Chip>)}
        </div>
      </div>
    </div>
  );
}

function ValueRow({ v, index, count, onMove, onSave, onRename, onDelete }: { v: PersonalValue; index: number; count: number; onMove: (i: number, d: -1 | 1) => void; onSave: (m: string | null) => void; onRename: (n: string) => void; onDelete: () => void }) {
  const [meaning, setMeaning] = useState(v.meaning ?? "");
  const [n, setN] = useState(v.name);
  useEffect(() => { setMeaning(v.meaning ?? ""); setN(v.name); }, [v.meaning, v.name]);
  return (
    <li className="card p-6 md:p-7">
      <div className="flex items-start gap-4">
        <span className="mt-2 font-serif text-sm tabular-nums text-stone">{String(index + 1).padStart(2, "0")}</span>
        <div className="flex-1">
          <input aria-label="Value name" className="w-full bg-transparent font-serif text-[1.6rem] text-forest focus:outline-none" value={n} onChange={(e) => setN(e.target.value)} onBlur={() => n.trim() && n !== v.name && onRename(n.trim())} maxLength={40} />
          <TextArea
            aria-label={`What ${v.name} means in practice`}
            minRows={2}
            className="mt-2 !border-transparent !bg-transparent !px-0 text-[15px] focus:!shadow-none"
            placeholder={`What does ${v.name.toLowerCase()} look like in your daily life?`}
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            onBlur={() => meaning !== (v.meaning ?? "") && onSave(meaning.trim() || null)}
            maxLength={1000}
          />
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex">
            <IconButton label={`Move ${v.name} up`} disabled={index === 0} onClick={() => onMove(index, -1)} className="h-8 w-8 disabled:opacity-30"><ArrowUp size={14} /></IconButton>
            <IconButton label={`Move ${v.name} down`} disabled={index === count - 1} onClick={() => onMove(index, 1)} className="h-8 w-8 disabled:opacity-30"><ArrowDown size={14} /></IconButton>
          </div>
          <ConfirmDelete label="Remove" onConfirm={onDelete} />
        </div>
      </div>
    </li>
  );
}
