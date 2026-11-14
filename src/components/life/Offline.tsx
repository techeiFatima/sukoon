"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { OFFLINE_IDEAS, OFFLINE_IDEAS_ISLAMIC } from "@/content/prompts";
import { formatShortDate, localDate } from "@/lib/dates";
import { useCollection } from "@/lib/hooks";
import { Button, ConfirmDelete, ErrorNote, Label, Modal, TextArea } from "../ui";

export function Offline() {
  const { profile } = useApp();
  const actions = useCollection("offline_actions", { orderBy: "date" });
  const ideas = profile?.experience === "islamic" ? OFFLINE_IDEAS_ISLAMIC : OFFLINE_IDEAS;
  const [logging, setLogging] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr]">
      <section>
        <p className="mb-8 max-w-xl text-[15px] leading-relaxed text-muted">
          Sukoon is meant to be a bridge, not a destination. Choose something here — then close the app and go do it.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ideas.map((i) => (
            <li key={i}>
              <button onClick={() => setLogging(i)} className="card flex h-full w-full items-center justify-between gap-3 p-5 text-left font-serif text-[1.1rem] leading-snug text-forest transition-colors hover:border-sage">
                {i}
                <span className="shrink-0 font-sans text-[12px] text-muted">I did this</span>
              </button>
            </li>
          ))}
        </ul>
        <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) setLogging(custom.trim()); }}>
          <label htmlFor="off-custom" className="sr-only">Something else you did offline</label>
          <input id="off-custom" className="field-quiet flex-1" placeholder="Something else meaningful you did…" value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={120} />
          <Button type="submit" variant="ghost" size="sm" disabled={!custom.trim()}>Log</Button>
        </form>
      </section>

      <section aria-labelledby="off-h">
        <h2 id="off-h" className="eyebrow mb-5">Life lived beyond the screen</h2>
        <ErrorNote onRetry={actions.refresh}>{actions.error}</ErrorNote>
        {actions.items.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted">Moments you choose to remember will gather here. There’s no target — only a record of a life you’re actually living.</p>
        ) : (
          <ul className="space-y-5">
            {actions.items.slice(0, 20).map((a) => (
              <li key={a.id} className="border-l-2 border-sage pl-5">
                <p className="text-[12px] text-muted">{formatShortDate(a.date)}</p>
                <p className="font-serif text-lg text-forest">{a.title}</p>
                {a.note && <p className="mt-1 text-sm leading-relaxed text-ink/80">{a.note}</p>}
                <ConfirmDelete className="mt-1" onConfirm={() => actions.remove(a.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={logging !== null} onClose={() => setLogging(null)} title={logging ?? ""}>
        <form className="space-y-5" onSubmit={async (e) => {
          e.preventDefault();
          if (!logging) return;
          setBusy(true);
          const ok = await actions.create({ title: logging, date: localDate(), note: note.trim() || null });
          setBusy(false);
          if (ok) { setLogging(null); setNote(""); setCustom(""); }
        }}>
          <div>
            <Label htmlFor="off-note" hint="Optional">What do you want to remember about it?</Label>
            <TextArea id="off-note" minRows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={800} />
          </div>
          <div className="flex justify-end"><Button type="submit" loading={busy}>Remember this</Button></div>
        </form>
      </Modal>
    </div>
  );
}
