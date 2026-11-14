"use client";

import { useApp } from "@/lib/app-context";
import { dayOfYear } from "@/lib/dates";
import { thoughtForDay } from "@/content/thoughts";

export function ThoughtCard() {
  const { profile } = useApp();
  const t = thoughtForDay(dayOfYear(), profile?.experience === "islamic");
  return (
    <figure className="relative overflow-hidden rounded-[22px] bg-forest px-7 py-9 text-ivory md:px-9 md:py-11">
      <svg aria-hidden viewBox="0 0 100 100" className="absolute -bottom-10 -right-10 h-48 w-48 text-ivory/[0.06]" fill="none" stroke="currentColor" strokeWidth="0.8">
        <rect x="20" y="20" width="60" height="60" />
        <rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)" />
      </svg>
      <p className="eyebrow mb-6 !text-sage">Thought of the day</p>
      {t.arabic && <p lang="ar" className="arabic mb-4 text-right text-[1.45rem] text-sand">{t.arabic}</p>}
      <blockquote className="font-serif text-[1.45rem] leading-snug md:text-[1.6rem]">“{t.text}”</blockquote>
      <figcaption className="mt-6 text-[13px] text-ivory/70">
        <span className="text-ivory/90">{t.author}</span> — {t.source}
      </figcaption>
    </figure>
  );
}
