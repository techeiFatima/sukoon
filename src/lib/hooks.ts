"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "./app-context";
import type { ListOptions } from "./store/types";
import type { NewRow, TableMap, TableName } from "./types";

export interface Collection<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  create: (row: NewRow<T>) => Promise<T | null>;
  update: (id: string, patch: Partial<NewRow<T>>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

function msg(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Please try again.";
}

/**
 * Loads a table and keeps local state in sync after each mutation. Updates are
 * applied optimistically and rolled back if the store rejects them.
 */
export function useCollection<K extends TableName>(table: K, opts?: ListOptions<TableMap[K]>): Collection<TableMap[K]> {
  type T = TableMap[K];
  const store = useStore();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(opts ?? {});
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const refresh = useCallback(async () => {
    try {
      setItems(await store.list(table, optsRef.current));
      setError(null);
    } catch (e) {
      setError(msg(e));
    } finally {
      setLoading(false);
    }
  }, [store, table]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh, key]);

  const create = useCallback(
    async (row: NewRow<T>) => {
      try {
        const created = await store.insert(table, row);
        const asc = optsRef.current?.ascending;
        setItems((xs) => (asc ? [...xs, created] : [created, ...xs]));
        setError(null);
        return created;
      } catch (e) {
        setError(msg(e));
        return null;
      }
    },
    [store, table],
  );

  const update = useCallback(
    async (id: string, patch: Partial<NewRow<T>>) => {
      let previous: T[] = [];
      setItems((xs) => {
        previous = xs;
        return xs.map((x) => (x.id === id ? { ...x, ...patch } : x));
      });
      try {
        const next = await store.update(table, id, patch);
        setItems((xs) => xs.map((x) => (x.id === id ? next : x)));
        setError(null);
        return next;
      } catch (e) {
        setItems(previous);
        setError(msg(e));
        return null;
      }
    },
    [store, table],
  );

  const remove = useCallback(
    async (id: string) => {
      let previous: T[] = [];
      setItems((xs) => {
        previous = xs;
        return xs.filter((x) => x.id !== id);
      });
      try {
        await store.remove(table, id);
        setError(null);
        return true;
      } catch (e) {
        setItems(previous);
        setError(msg(e));
        return false;
      }
    },
    [store, table],
  );

  return { items, loading, error, create, update, remove, refresh };
}

/** Debounced autosave helper for free-text fields. */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay = 700) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []);
  return useCallback((...args: A) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]);
}
