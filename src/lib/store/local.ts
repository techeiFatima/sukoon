import type { NewRow, Profile, TableMap, TableName } from "../types";
import { TABLES } from "../types";
import type { ListOptions, Store } from "./types";

const PREFIX = "sukoon:v1:";
export const LOCAL_USER_ID = "local";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    throw new Error(
      "Your browser would not let Sukoon save this (storage may be full or disabled in private browsing).",
      { cause: e },
    );
  }
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function sortRows<T>(rows: T[], opts?: ListOptions<T>): T[] {
  const key = (opts?.orderBy ?? "created_at") as keyof T;
  const dir = opts?.ascending ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[key] as unknown as string | number;
    const bv = b[key] as unknown as string | number;
    if (av === bv) return 0;
    return av > bv ? dir : -dir;
  });
}

export class LocalStore implements Store {
  readonly kind = "local" as const;

  async list<K extends TableName>(table: K, opts?: ListOptions<TableMap[K]>) {
    let rows = read<TableMap[K][]>(table, []);
    if (opts?.eq) {
      const entries = Object.entries(opts.eq);
      rows = rows.filter((r) => entries.every(([k, v]) => (r as unknown as Record<string, unknown>)[k] === v));
    }
    return sortRows(rows, opts);
  }

  async insert<K extends TableName>(table: K, row: NewRow<TableMap[K]>) {
    const now = new Date().toISOString();
    const full = { ...row, id: uid(), user_id: LOCAL_USER_ID, created_at: now, updated_at: now } as unknown as TableMap[K];
    const rows = read<TableMap[K][]>(table, []);
    write(table, [...rows, full]);
    return full;
  }

  async update<K extends TableName>(table: K, id: string, patch: Partial<NewRow<TableMap[K]>>) {
    const rows = read<TableMap[K][]>(table, []);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("That item no longer exists.");
    const next = { ...rows[idx], ...patch, updated_at: new Date().toISOString() } as TableMap[K];
    rows[idx] = next;
    write(table, rows);
    return next;
  }

  async remove(table: TableName, id: string) {
    const rows = read<{ id: string }[]>(table, []);
    write(table, rows.filter((r) => r.id !== id));
    if (table === "knowledge_notes") {
      const conns = read<TableMap["knowledge_connections"][]>("knowledge_connections", []);
      write("knowledge_connections", conns.filter((c) => c.from_note_id !== id && c.to_note_id !== id));
    }
    if (table === "personal_values") {
      const al = read<TableMap["alignment_reflections"][]>("alignment_reflections", []);
      write("alignment_reflections", al.filter((a) => a.value_id !== id));
    }
  }

  async getProfile() {
    return read<Profile | null>("profile", null);
  }

  async saveProfile(patch: Partial<Profile>) {
    const now = new Date().toISOString();
    const current = read<Profile | null>("profile", null);
    const next: Profile = {
      id: LOCAL_USER_ID,
      display_name: null,
      experience: "general",
      tradition: "unspecified",
      motivations: [],
      change_note: null,
      ai_mode: "local",
      ai_consent_at: null,
      onboarded_at: null,
      created_at: now,
      ...current,
      ...patch,
      updated_at: now,
    };
    write("profile", next);
    return next;
  }

  async exportAll() {
    const out: Record<string, unknown> = { profile: read("profile", null) };
    for (const t of TABLES) out[t] = read(t, []);
    return out;
  }

  async deleteAll() {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(PREFIX) || k?.startsWith("sukoon:")) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  }
}
