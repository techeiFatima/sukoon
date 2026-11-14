"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Plus, X } from "lucide-react";
import { useApp, useStore } from "@/lib/app-context";
import { formatRelative, localDate } from "@/lib/dates";
import { useCollection } from "@/lib/hooks";
import type { SavedLecture } from "@/lib/types";
import { CURATION_NOTE, curatedFor, WATCHLIST_LIMIT } from "@/content/lectures";
import { TOPICS } from "@/content/islamic";
import { Breath, Button, Chip, ConfirmDelete, EmptyState, ErrorNote, Label, Modal, SectionTitle, TextArea } from "../ui";

interface FeedVideo { videoId: string; title: string; channelId: string; channelName: string; publishedAt: string | null }
interface Feed { channelId: string; channelName: string; videos: FeedVideo[] }

const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export function Lectures() {
  const { profile } = useApp();
  const sources = useCollection("lecture_sources", { orderBy: "created_at", ascending: true });
  const saved = useCollection("saved_lectures");
  const curated = useMemo(() => curatedFor(profile?.tradition ?? "unspecified"), [profile?.tradition]);

  const allSources = useMemo(() => {
    const m = new Map<string, { channelId: string; name: string; vetted: boolean; note?: string; id?: string }>();
    curated.forEach((c) => m.set(c.channelId, { channelId: c.channelId, name: c.name, vetted: true, note: c.note }));
    sources.items.forEach((s) => { if (!m.has(s.channel_id)) m.set(s.channel_id, { channelId: s.channel_id, name: s.name, vetted: false, id: s.id }); });
    return [...m.values()];
  }, [curated, sources.items]);

  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [feedErrors, setFeedErrors] = useState<string[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [playing, setPlaying] = useState<SavedLecture | null>(null);
  const channelKey = allSources.map((s) => s.channelId).join(",");

  const loadFeed = useCallback(async () => {
    if (!channelKey) { setFeeds([]); return; }
    setLoadingFeed(true);
    setFeedError(null);
    try {
      const res = await fetch(`/api/lectures?channels=${channelKey}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn’t load lectures.");
      setFeeds(data.channels);
      setFeedErrors((data.errors as { channelId: string }[]).map((e) => allSources.find((s) => s.channelId === e.channelId)?.name ?? e.channelId));
    } catch (e) {
      setFeedError(e instanceof Error ? e.message : "Couldn’t load lectures.");
    } finally {
      setLoadingFeed(false);
    }
  }, [channelKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void loadFeed(); }, [loadFeed]);

  const toWatch = saved.items.filter((s) => s.status === "to_watch");
  const watched = saved.items.filter((s) => s.status === "watched");
  const savedIds = new Set(saved.items.map((s) => s.video_id));
  const full = toWatch.length >= WATCHLIST_LIMIT;

  const recent = useMemo(() => {
    const vids = feeds.filter((f) => !filter || f.channelId === filter).flatMap((f) => f.videos.slice(0, filter ? 4 : 3));
    return vids.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")).slice(0, 9);
  }, [feeds, filter]);

  const topicFor = (channelId: string) => curated.find((c) => c.channelId === channelId)?.topics?.[0] ?? null;

  return (
    <div className="space-y-16">
      <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
        A small library of lectures from teachers you trust. Choose one with intention, listen fully, then carry one thing into your life. Your watch list holds {WATCHLIST_LIMIT} at most — so you learn rather than collect.
      </p>

      <section aria-labelledby="wl-h">
        <SectionTitle title="Your watch list" hint={`${toWatch.length} of ${WATCHLIST_LIMIT}`} />
        <ErrorNote onRetry={saved.refresh}>{saved.error}</ErrorNote>
        {toWatch.length === 0 ? (
          <p className="text-sm text-muted">Nothing waiting. Choose a lecture below when you have time to give it your full attention.</p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {toWatch.map((l) => (
              <li key={l.id} className="card overflow-hidden p-0">
                <button onClick={() => setPlaying(l)} className="group block w-full text-left" aria-label={`Watch ${l.title}`}>
                  <div className="relative aspect-video overflow-hidden bg-sand-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(l.video_id)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                  </div>
                  <div className="p-5 pb-3">
                    <p className="line-clamp-2 font-serif text-[1.1rem] leading-snug text-forest">{l.title}</p>
                    <p className="mt-1 text-[13px] text-muted">{l.channel_name}</p>
                  </div>
                </button>
                <div className="flex items-center justify-between gap-3 px-5 pb-5">
                  <label className="sr-only" htmlFor={`topic-${l.id}`}>Link to a Soul topic</label>
                  <select id={`topic-${l.id}`} className="rounded-full border border-line bg-paper px-3 py-1.5 text-[12px] text-muted" value={l.topic_slug ?? ""} onChange={(e) => saved.update(l.id, { topic_slug: e.target.value || null })}>
                    <option value="">Link to a topic…</option>
                    {TOPICS.map((t) => <option key={t.slug} value={t.slug}>{t.name} · {t.gloss}</option>)}
                  </select>
                  <ConfirmDelete label="Remove" onConfirm={() => saved.remove(l.id)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-h">
        <SectionTitle title="Recently from your sources" hint="A few recent talks — not a feed." />
        {allSources.length > 1 && (
          <div className="no-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 py-1">
            <Chip selected={!filter} onClick={() => setFilter(null)}>All sources</Chip>
            {allSources.map((s) => <Chip key={s.channelId} selected={filter === s.channelId} onClick={() => setFilter(s.channelId)} className="shrink-0">{s.name}</Chip>)}
          </div>
        )}
        {allSources.length === 0 ? (
          <EmptyState title="No sources yet">
            Add a teacher you trust below. Sukoon will show only a few of their most recent lectures.
          </EmptyState>
        ) : loadingFeed ? (
          <div className="py-10"><Breath label="Gathering recent lectures…" /></div>
        ) : feedError ? (
          <ErrorNote onRetry={loadFeed}>{feedError}</ErrorNote>
        ) : (
          <>
            {feedErrors.length > 0 && <p className="mb-4 text-[13px] text-muted">Couldn’t reach: {feedErrors.join(", ")}.</p>}
            {recent.length === 0 ? (
              <p className="text-sm text-muted">No recent lectures found.</p>
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {recent.map((v) => {
                  const isSaved = savedIds.has(v.videoId);
                  return (
                    <li key={v.videoId} className="flex items-center gap-4 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb(v.videoId)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="hidden aspect-video w-32 shrink-0 rounded-xl object-cover sm:block" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-serif text-[1.05rem] leading-snug text-forest">{v.title}</p>
                        <p className="mt-1 text-[12px] text-muted">{v.channelName}{v.publishedAt && ` · ${formatRelative(v.publishedAt)}`}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={isSaved ? "quiet" : "secondary"}
                        disabled={isSaved || full}
                        title={full && !isSaved ? "Your watch list is full — watch or remove one first" : undefined}
                        onClick={() => saved.create({ video_id: v.videoId, title: v.title.slice(0, 300), channel_id: v.channelId, channel_name: v.channelName, published_at: v.publishedAt, topic_slug: topicFor(v.channelId), status: "to_watch", takeaway: null, watched_at: null })}
                      >
                        {isSaved ? <><Check size={14} /> Saved</> : <><Plus size={14} /> Watch list</>}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
            {full && <p className="mt-4 text-[13px] text-muted">Your watch list is full. Watch or remove a lecture to make room.</p>}
          </>
        )}
      </section>

      <Sources allSources={allSources} onAdd={(channelId, name) => sources.create({ channel_id: channelId, name })} onRemove={(id) => sources.remove(id)} error={sources.error} />

      {watched.length > 0 && (
        <section aria-labelledby="carried-h">
          <SectionTitle title="What you’ve carried forward" />
          <ul className="space-y-6">
            {watched.map((l) => (
              <li key={l.id} className="border-l-2 border-sage pl-6">
                <p className="text-[12px] text-muted">{l.watched_at ? formatRelative(l.watched_at) : ""} · {l.channel_name}{l.topic_slug && <> · <Link href={`/soul/${l.topic_slug}`} className="text-forest hover:underline">{TOPICS.find((t) => t.slug === l.topic_slug)?.name}</Link></>}</p>
                <p className="mt-1 font-serif text-lg text-forest">{l.title}</p>
                {l.takeaway && <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{l.takeaway}</p>}
                <ConfirmDelete className="mt-2" onConfirm={() => saved.remove(l.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <Player lecture={playing} onClose={() => setPlaying(null)} onWatched={async (takeaway) => {
        if (!playing) return;
        await saved.update(playing.id, { status: "watched", takeaway, watched_at: new Date().toISOString() });
        setPlaying(null);
      }} />
    </div>
  );
}

function Sources({ allSources, onAdd, onRemove, error }: {
  allSources: { channelId: string; name: string; vetted: boolean; note?: string; id?: string }[];
  onAdd: (channelId: string, name: string) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
  error: string | null;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <section aria-labelledby="src-h">
      <SectionTitle title="Sources" hint="Teachers whose lectures appear here." />
      {allSources.length > 0 && (
        <ul className="mb-6 divide-y divide-line border-y border-line">
          {allSources.map((s) => (
            <li key={s.channelId} className="flex items-start justify-between gap-4 py-3.5">
              <div>
                <p className="text-[15px] text-ink">
                  {s.name}
                  {s.vetted && <span className="ml-2 rounded-full bg-sage-soft px-2 py-0.5 text-[11px] text-forest">Vetted</span>}
                </p>
                {s.note && <p className="mt-0.5 text-[13px] text-muted">{s.note}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <a href={`https://www.youtube.com/channel/${s.channelId}`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-forest" aria-label={`${s.name} on YouTube`}><ArrowUpRight size={15} /></a>
                {s.id && <button aria-label={`Remove ${s.name}`} className="text-muted hover:text-clay" onClick={() => onRemove(s.id!)}><X size={15} /></button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!input.trim()) return;
          setBusy(true);
          setErr(null);
          try {
            const res = await fetch("/api/lectures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Couldn’t add that channel.");
            if (allSources.some((s) => s.channelId === data.channelId)) throw new Error(`${data.name} is already one of your sources.`);
            await onAdd(data.channelId, data.name);
            setInput("");
          } catch (e2) {
            setErr(e2 instanceof Error ? e2.message : "Couldn’t add that channel.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label htmlFor="src-in" className="sr-only">YouTube channel link</label>
        <input id="src-in" className="field flex-1" placeholder="Paste a channel link — youtube.com/@name" value={input} onChange={(e) => setInput(e.target.value)} maxLength={200} />
        <Button type="submit" variant="secondary" loading={busy} disabled={!input.trim()}>Add a source</Button>
      </form>
      <ErrorNote>{err || error}</ErrorNote>
      <p className="mt-5 max-w-2xl text-[12px] leading-relaxed text-muted">{CURATION_NOTE}</p>
    </section>
  );
}

function Player({ lecture, onClose, onWatched }: { lecture: SavedLecture | null; onClose: () => void; onWatched: (takeaway: string | null) => Promise<void> }) {
  const store = useStore();
  const [takeaway, setTakeaway] = useState("");
  const [addToToday, setAddToToday] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setTakeaway(""); setAddToToday(true); }, [lecture?.id]);

  return (
    <Modal open={lecture !== null} onClose={onClose} title={lecture?.title ?? ""} wide>
      {lecture && (
        <div>
          <div className="aspect-video overflow-hidden rounded-2xl bg-ink">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${lecture.video_id}?rel=0&modestbranding=1`}
              title={lecture.title}
              className="h-full w-full"
              allow="encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <p className="mt-3 flex items-center justify-between text-[12px] text-muted">
            <span>{lecture.channel_name}</span>
            <a href={`https://www.youtube.com/watch?v=${lecture.video_id}`} target="_blank" rel="noopener noreferrer" className="hover:text-forest">Won’t play here? Open on YouTube ↗</a>
          </p>

          <div className="mt-8 border-t border-line pt-6">
            <Label htmlFor="takeaway">When you’ve finished: what is one thing you’ll practise this week?</Label>
            <TextArea id="takeaway" minRows={3} value={takeaway} onChange={(e) => setTakeaway(e.target.value)} maxLength={2000} placeholder="Something small and concrete…" />
            <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-ink">
              <input type="checkbox" checked={addToToday} onChange={(e) => setAddToToday(e.target.checked)} className="h-4 w-4 accent-[#233F35]" />
              Add it to today’s commitments
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="quiet" onClick={onClose}>Later</Button>
              <Button loading={busy} onClick={async () => {
                setBusy(true);
                const t = takeaway.trim();
                if (t && addToToday) {
                  try { await store.insert("commitments", { title: t.length > 150 ? t.slice(0, 147) + "…" : t, date: localDate(), done: false, done_at: null }); } catch { /* shown on Today */ }
                }
                await onWatched(t || null);
                setBusy(false);
              }}>
                <Check size={15} /> {takeaway.trim() ? "Mark watched and keep this" : "Mark as watched"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
