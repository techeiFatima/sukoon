"use client";

import { useEffect, useState } from "react";
import type { ResourceKind, ResourceStatus, SavedResource } from "@/lib/types";
import { Button, Chip, ConfirmDelete, Label, Modal, TextArea } from "../ui";

export const RESOURCE_KINDS: { id: ResourceKind; label: string }[] = [
  { id: "book", label: "Book" },
  { id: "article", label: "Article" },
  { id: "paper", label: "Paper" },
  { id: "lecture", label: "Lecture" },
  { id: "video", label: "Video" },
  { id: "quote", label: "Quotation" },
];
export const RESOURCE_STATUS: { id: ResourceStatus; label: string }[] = [
  { id: "to_explore", label: "To explore" },
  { id: "in_progress", label: "In progress" },
  { id: "finished", label: "Finished" },
];

export type ResourceDraft = Omit<SavedResource, "id" | "user_id" | "created_at" | "updated_at">;

export function safeUrl(u: string | null): string | null {
  if (!u) return null;
  try {
    const url = new URL(u.startsWith("http") ? u : `https://${u}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function ResourceForm({
  open,
  initial,
  journeyId = null,
  collections,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  initial?: SavedResource | null;
  journeyId?: string | null;
  collections: string[];
  onClose: () => void;
  onSave: (d: ResourceDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const blank: ResourceDraft = { kind: "book", title: "", author: null, url: null, note: null, collection: null, status: "to_explore", journey_id: journeyId };
  const [d, setD] = useState<ResourceDraft>(blank);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setD(initial ? { ...initial } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);
  const p = (x: Partial<ResourceDraft>) => setD((s) => ({ ...s, ...x }));
  const isQuote = d.kind === "quote";

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit" : "Save to your library"}>
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!d.title.trim()) return;
          setBusy(true);
          await onSave({ ...d, title: d.title.trim(), url: safeUrl(d.url), collection: d.collection?.trim() || null });
          setBusy(false);
        }}
      >
        <div className="flex flex-wrap gap-2">
          {RESOURCE_KINDS.map((k) => <Chip key={k.id} selected={d.kind === k.id} onClick={() => p({ kind: k.id })}>{k.label}</Chip>)}
        </div>
        <div>
          <Label htmlFor="r-title">{isQuote ? "Quotation" : "Title"}</Label>
          {isQuote ? (
            <TextArea id="r-title" minRows={3} value={d.title} onChange={(e) => p({ title: e.target.value })} maxLength={1200} />
          ) : (
            <input id="r-title" className="field" value={d.title} onChange={(e) => p({ title: e.target.value })} maxLength={200} />
          )}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="r-author" hint="Optional">{isQuote ? "Said or written by" : "Author / speaker"}</Label>
            <input id="r-author" className="field" value={d.author ?? ""} onChange={(e) => p({ author: e.target.value || null })} maxLength={120} />
          </div>
          <div>
            <Label htmlFor="r-col" hint="Optional">Collection</Label>
            <input id="r-col" list="r-cols" className="field" value={d.collection ?? ""} onChange={(e) => p({ collection: e.target.value || null })} maxLength={60} placeholder="e.g. Philosophy of mind" />
            <datalist id="r-cols">{collections.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
        </div>
        {!isQuote && (
          <div>
            <Label htmlFor="r-url" hint="Optional">Link</Label>
            <input id="r-url" className="field" inputMode="url" value={d.url ?? ""} onChange={(e) => p({ url: e.target.value || null })} maxLength={500} placeholder="https://" />
          </div>
        )}
        <div>
          <Label htmlFor="r-note" hint="Optional">{isQuote ? "Source and why it matters" : "Why you saved it"}</Label>
          <TextArea id="r-note" minRows={2} value={d.note ?? ""} onChange={(e) => p({ note: e.target.value || null })} maxLength={1000} />
        </div>
        {!isQuote && (
          <div className="flex flex-wrap gap-2">
            {RESOURCE_STATUS.map((s) => <Chip key={s.id} selected={d.status === s.id} onClick={() => p({ status: s.id })}>{s.label}</Chip>)}
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          {onDelete ? <ConfirmDelete onConfirm={onDelete} /> : <span />}
          <Button type="submit" disabled={!d.title.trim()} loading={busy}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
