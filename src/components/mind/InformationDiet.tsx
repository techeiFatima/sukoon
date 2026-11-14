"use client";

import { useState } from "react";
import { DIET_DEFAULTS } from "@/content/prompts";
import { useCollection } from "@/lib/hooks";
import { Button, Chip, ErrorNote, Loading } from "../ui";

export function InformationDiet() {
  const items = useCollection("diet_items", { orderBy: "created_at", ascending: true });
  if (items.loading) return <Loading label="" />;
  const empty = items.items.length === 0;

  return (
    <div>
      <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-muted">
        What you consume shapes what you think about, what you desire, and who you become. Decide deliberately what you want more of — and less of.
      </p>
      <ErrorNote onRetry={items.refresh}>{items.error}</ErrorNote>
      {empty && (
        <div className="mb-10 rounded-2xl border border-dashed border-sand p-5 text-sm text-muted">
          Not sure where to begin?{" "}
          <button
            className="text-forest underline underline-offset-4"
            onClick={async () => {
              for (const label of DIET_DEFAULTS.more) await items.create({ direction: "more", label });
              for (const label of DIET_DEFAULTS.less) await items.create({ direction: "less", label });
            }}
          >
            Start with a few suggestions
          </button>{" "}
          and edit them to fit your life.
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <Column title="More of" hint="What nourishes you" direction="more" items={items} />
        <Column title="Less of" hint="What scatters or unsettles you" direction="less" items={items} />
      </div>
    </div>
  );
}

function Column({ title, hint, direction, items }: { title: string; hint: string; direction: "more" | "less"; items: ReturnType<typeof useCollection<"diet_items">> }) {
  const [v, setV] = useState("");
  const list = items.items.filter((i) => i.direction === direction);
  const id = `diet-${direction}`;
  return (
    <section className={direction === "more" ? "card p-7" : "rounded-[22px] border border-line bg-sand-soft/40 p-7"} aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="font-serif text-[1.7rem] text-forest">{title}</h3>
      <p className="mb-6 text-sm text-muted">{hint}</p>
      <div className="flex min-h-10 flex-wrap gap-2">
        {list.map((i) => (
          <Chip key={i.id} removable onRemove={() => items.remove(i.id)}>{i.label}</Chip>
        ))}
        {list.length === 0 && <span className="text-sm text-stone">Nothing yet.</span>}
      </div>
      <form
        className="mt-6 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const label = v.trim();
          if (!label || list.some((x) => x.label.toLowerCase() === label.toLowerCase())) return;
          setV("");
          await items.create({ direction, label });
        }}
      >
        <label htmlFor={id} className="sr-only">Add to {title.toLowerCase()}</label>
        <input id={id} className="field-quiet flex-1" placeholder="Add…" value={v} onChange={(e) => setV(e.target.value)} maxLength={60} />
        <Button type="submit" variant="ghost" size="sm" disabled={!v.trim()}>Add</Button>
      </form>
    </section>
  );
}
