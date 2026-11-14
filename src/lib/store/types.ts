import type { NewRow, Profile, TableMap, TableName } from "../types";

export interface ListOptions<T> {
  eq?: Partial<Record<keyof T & string, string | number | boolean | null>>;
  orderBy?: keyof T & string;
  ascending?: boolean;
}

/**
 * The single persistence interface used by every screen. Two implementations:
 * LocalStore (browser storage, no account) and SupabaseStore (Postgres + RLS).
 */
export interface Store {
  readonly kind: "local" | "cloud";
  list<K extends TableName>(table: K, opts?: ListOptions<TableMap[K]>): Promise<TableMap[K][]>;
  insert<K extends TableName>(table: K, row: NewRow<TableMap[K]>): Promise<TableMap[K]>;
  update<K extends TableName>(table: K, id: string, patch: Partial<NewRow<TableMap[K]>>): Promise<TableMap[K]>;
  remove(table: TableName, id: string): Promise<void>;
  getProfile(): Promise<Profile | null>;
  saveProfile(patch: Partial<Profile>): Promise<Profile>;
  exportAll(): Promise<Record<string, unknown>>;
  deleteAll(): Promise<void>;
}
