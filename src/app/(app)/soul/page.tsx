"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { useCollection } from "@/lib/hooks";
import { CONTENT_REVIEW_NOTE, TOPICS } from "@/content/islamic";
import { Journal } from "@/components/soul/Journal";
import { Lectures } from "@/components/soul/Lectures";
import { PageHeader, Tabs } from "@/components/ui";

type Tab = "journey" | "lectures" | "journal";

export default function Soul() {
  const { profile } = useApp();
  const islamic = profile?.experience === "islamic";
  const [tab, setTab] = useState<Tab>(islamic ? "journey" : "journal");
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "journey" || t === "journal" || t === "lectures") setTab(t);
  }, []);

  const tabs: { id: Tab; label: string }[] = islamic
    ? [{ id: "journey", label: "Islamic journey" }, { id: "lectures", label: "Lectures" }, { id: "journal", label: "Personal reflection" }]
    : [{ id: "journal", label: "Personal reflection" }, { id: "journey", label: "Islamic journey" }, { id: "lectures", label: "Lectures" }];

  return (
    <div>
      <PageHeader eyebrow="Soul" title="Tend to your inner life">
        {islamic
          ? "Ten foundational concepts of Islamic spirituality with their sources and practices, a small library of lectures from trusted teachers, and a private journal for honest self-reflection."
          : "A private journal for honest self-reflection. If you’re curious, you can also explore the Islamic tradition of inner development."}
      </PageHeader>
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === "journey" ? <Journey /> : tab === "lectures" ? <Lectures /> : <Journal />}
    </div>
  );
}

function Journey() {
  const notes = useCollection("reflections", { eq: { kind: "soul" } });
  const explored = new Set(notes.items.map((n) => n.context));
  return (
    <div>
      <ol className="grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((t, i) => (
          <li key={t.slug} className="bg-paper">
            <Link href={`/soul/${t.slug}`} className="group flex h-full flex-col p-7 transition-colors hover:bg-ivory">
              <div className="flex items-start justify-between">
                <span className="text-[12px] tabular-nums text-stone">{String(i + 1).padStart(2, "0")}</span>
                <span lang="ar" className="arabic text-[1.6rem] leading-none text-sage transition-colors group-hover:text-forest">{t.arabic}</span>
              </div>
              <h2 className="mt-6 text-[1.7rem] text-forest">{t.name}</h2>
              <p className="text-sm text-muted">{t.gloss}</p>
              <p className="mt-4 flex-1 text-[14px] leading-relaxed text-ink/80">{t.summary}</p>
              {explored.has(t.slug) && <p className="mt-5 text-[12px] text-forest">◆ You have notes here</p>}
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-8 max-w-3xl text-[12px] leading-relaxed text-muted">{CONTENT_REVIEW_NOTE}</p>
    </div>
  );
}
