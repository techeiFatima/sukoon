"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Plus } from "lucide-react";
import { useApp, useStore } from "@/lib/app-context";
import { localDate } from "@/lib/dates";
import { useAutosaveReflection } from "@/lib/useAutosave";
import { useCollection } from "@/lib/hooks";
import { CONTENT_REVIEW_NOTE, quranUrl, topicBySlug, TOPICS, TRADITION_POLICY, TRANSLATION_NOTE } from "@/content/islamic";
import { cx, EmptyState, SavedHint, TextArea } from "@/components/ui";

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const topic = topicBySlug(slug);
  const { profile } = useApp();
  const store = useStore();
  const [prompt, setPrompt] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const lectures = useCollection("saved_lectures", { eq: { topic_slug: slug } });
  const notes = useAutosaveReflection({ kind: "soul", context: slug, prompt: prompt ?? topic?.name ?? null });

  if (!topic) {
    return (
      <EmptyState title="We couldn’t find that topic" action={<Link href="/soul" className="text-forest underline underline-offset-4">Back to Soul</Link>} />
    );
  }

  const idx = TOPICS.findIndex((t) => t.slug === topic.slug);
  const nextTopic = TOPICS[(idx + 1) % TOPICS.length];
  const showShiaNote = profile?.tradition === "shia" || profile?.tradition === "both";

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/soul" className="mb-12 inline-flex items-center gap-1.5 text-sm text-muted hover:text-forest"><ArrowLeft size={15} /> Islamic journey</Link>

      <header className="mb-14 text-center">
        <p lang="ar" className="arabic text-[3.4rem] leading-tight text-forest">{topic.arabic}</p>
        <h1 className="mt-2 text-[2.8rem] text-forest">{topic.name}</h1>
        <p className="eyebrow mt-2">{topic.gloss}</p>
      </header>

      {showShiaNote && (
        <p className="mb-10 rounded-2xl border border-sand bg-sand-soft/50 px-5 py-4 text-[13px] leading-relaxed text-muted">{TRADITION_POLICY}</p>
      )}

      <section className="space-y-5 text-[17px] leading-[1.8] text-ink">
        {topic.explanation.map((p, i) => <p key={i}>{p}</p>)}
      </section>

      <section className="mt-16" aria-labelledby="q-h">
        <h2 id="q-h" className="eyebrow mb-6">From the Qur’an</h2>
        <div className="space-y-6">
          {topic.quran.map((q) => (
            <figure key={`${q.surah}:${q.ayah}`} className="card p-7 md:p-9">
              {q.arabic && <p lang="ar" className="arabic mb-5 text-right text-[1.75rem] text-forest">{q.arabic}</p>}
              <blockquote className="font-serif text-[1.3rem] leading-relaxed text-ink">{q.translation}</blockquote>
              <figcaption className="mt-5 flex items-center justify-between text-[13px] text-muted">
                <span>Surah {q.surahName} {q.surah}:{q.ayah}</span>
                <a href={quranUrl(q)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-forest hover:underline">
                  Read in context <ArrowUpRight size={13} />
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-muted">{TRANSLATION_NOTE}</p>
      </section>

      {topic.hadith.length > 0 && (
        <section className="mt-16" aria-labelledby="h-h">
          <h2 id="h-h" className="eyebrow mb-6">From the Sunnah and early tradition</h2>
          <div className="space-y-5">
            {topic.hadith.map((h, i) => (
              <figure key={i} className="border-l-2 border-sage pl-6">
                <blockquote className="font-serif text-[1.2rem] leading-relaxed text-ink">“{h.text}”</blockquote>
                <figcaption className="mt-3 space-y-1 text-[13px] text-muted">
                  <p className="text-ink/80">{h.source}</p>
                  {h.grading && <p>{h.grading}</p>}
                  {h.note && <p className="italic">{h.note}</p>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {topic.traditions?.map((t) => (
        <section key={t.label} className="mt-12 rounded-2xl bg-sage-soft/50 p-6">
          <h2 className="eyebrow mb-2">{t.label}</h2>
          <p className="text-[14px] leading-relaxed text-ink/85">{t.body}</p>
        </section>
      ))}

      <section className="mt-16" aria-labelledby="r-h">
        <h2 id="r-h" className="eyebrow mb-6">Questions to sit with</h2>
        <ul className="space-y-3">
          {topic.reflections.map((r) => (
            <li key={r}>
              <button
                onClick={() => { setPrompt(r); document.getElementById("soul-notes")?.focus(); }}
                className={cx("w-full rounded-2xl border px-5 py-4 text-left font-serif text-[1.15rem] leading-snug transition-colors", prompt === r ? "border-forest bg-forest text-ivory" : "border-line bg-paper text-forest hover:border-sage")}
              >
                {r}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="p-h">
        <h2 id="p-h" className="eyebrow mb-6">Small practices</h2>
        <ul className="space-y-4">
          {topic.practices.map((p) => {
            const done = added.includes(p);
            return (
              <li key={p} className="flex items-start justify-between gap-4 border-b border-line pb-4">
                <p className="text-[15px] leading-relaxed text-ink">{p}</p>
                <button
                  disabled={done}
                  onClick={async () => {
                    try {
                      await store.insert("commitments", { title: p.length > 110 ? p.slice(0, 107) + "…" : p, date: localDate(), done: false, done_at: null });
                      setAdded((a) => [...a, p]);
                    } catch { /* surfaced on Today */ }
                  }}
                  className="inline-flex shrink-0 items-center gap-1 text-[13px] text-forest disabled:text-muted"
                >
                  {done ? <><Check size={14} /> Added to today</> : <><Plus size={14} /> Try today</>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {lectures.items.length > 0 && (
        <section className="mt-16" aria-labelledby="l-h">
          <h2 id="l-h" className="eyebrow mb-5">Lectures you’ve linked</h2>
          <ul className="space-y-4">
            {lectures.items.map((l) => (
              <li key={l.id} className="border-l-2 border-sand pl-5">
                <p className="font-serif text-lg text-forest">{l.title}</p>
                <p className="text-[12px] text-muted">{l.channel_name} · {l.status === "watched" ? "watched" : "on your watch list"}</p>
                {l.takeaway && <p className="mt-1 text-[14px] text-ink">{l.takeaway}</p>}
              </li>
            ))}
          </ul>
          <Link href="/soul?tab=lectures" className="mt-4 inline-block text-[13px] text-forest underline underline-offset-4">Open lectures</Link>
        </section>
      )}

      <section className="mt-16 card p-7 md:p-9" aria-labelledby="n-h">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="n-h" className="eyebrow">Your notes on {topic.name}</h2>
          <SavedHint state={notes.state} />
        </div>
        {(() => { const q = prompt ?? (notes.savedPrompt !== topic.name ? notes.savedPrompt : null); return q ? <p className="mb-3 font-serif text-lg text-forest">{q}</p> : null; })()}
        <TextArea
          id="soul-notes"
          aria-label={`Your notes on ${topic.name}`}
          minRows={6}
          className="!border-transparent !bg-transparent !px-0 text-[15.5px] focus:!shadow-none"
          placeholder="What does this mean for your life right now?"
          value={notes.text}
          onChange={(e) => notes.setText(e.target.value)}
          disabled={notes.loading}
        />
        <p className="mt-2 border-t border-line pt-3 text-[12px] text-muted">Private to you. Saved automatically.</p>
      </section>

      <footer className="mt-20 flex items-center justify-between border-t border-line pt-8">
        <p className="max-w-md text-[12px] leading-relaxed text-muted">{CONTENT_REVIEW_NOTE}</p>
        <Link href={`/soul/${nextTopic.slug}`} className="shrink-0 text-right">
          <span className="eyebrow block">Next</span>
          <span className="font-serif text-xl text-forest">{nextTopic.name} →</span>
        </Link>
      </footer>
    </article>
  );
}
