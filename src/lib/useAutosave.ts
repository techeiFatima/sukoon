"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "./app-context";
import type { Reflection, ReflectionKind } from "./types";
import { localDate } from "./dates";

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * A single private reflection identified by (kind, date?, context?), saved
 * automatically as the person writes. Creates the row on first keystroke and
 * deletes it again if the text is cleared.
 */
export function useAutosaveReflection(opts: { kind: ReflectionKind; date?: string; context?: string | null; prompt?: string | null; delay?: number }) {
  const store = useStore();
  const { kind, date, context = null, prompt = null, delay = 800 } = opts;
  const [text, setTextState] = useState("");
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<SaveState>("idle");
  const [savedPrompt, setSavedPrompt] = useState<string | null>(null);
  const row = useRef<Reflection | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const latest = useRef({ text: "", prompt });
  latest.current.prompt = prompt;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const eq: Record<string, string | null> = { kind };
    if (date) eq.date = date;
    if (context !== null) eq.context = context;
    store
      .list("reflections", { eq })
      .then((rows) => {
        if (!alive) return;
        row.current = rows[0] ?? null;
        setTextState(rows[0]?.body ?? "");
        setSavedPrompt(rows[0]?.prompt ?? null);
        latest.current.text = rows[0]?.body ?? "";
      })
      .catch(() => alive && setState("error"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [store, kind, date, context]);

  const persist = useCallback(() => {
    chain.current = chain.current.then(async () => {
      const body = latest.current.text;
      setState("saving");
      try {
        if (row.current && !body.trim()) {
          await store.remove("reflections", row.current.id);
          row.current = null;
        } else if (row.current) {
          row.current = await store.update("reflections", row.current.id, { body, prompt: latest.current.prompt });
        } else if (body.trim()) {
          row.current = await store.insert("reflections", {
            kind,
            body,
            prompt: latest.current.prompt,
            date: date ?? localDate(),
            context,
          });
        }
        setState("saved");
      } catch {
        setState("error");
      }
    });
  }, [store, kind, date, context]);

  const setText = useCallback(
    (v: string) => {
      setTextState(v);
      latest.current.text = v;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { timer.current = null; persist(); }, delay);
    },
    [persist, delay],
  );

  // Flush pending edits when the component unmounts.
  useEffect(() => () => {
    if (timer.current) { clearTimeout(timer.current); persist(); }
  }, [persist]);

  return { text, setText, loading, state, savedPrompt };
}
