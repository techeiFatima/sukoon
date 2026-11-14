import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewRow, Profile, TableMap, TableName } from "../types";
import { TABLES } from "../types";
import type { ListOptions, Store } from "./types";

function fail(error: { message: string } | null, fallback: string): never {
  throw new Error(error?.message || fallback);
}

/**
 * Cloud persistence. Every table has Row Level Security restricting rows to
 * auth.uid(); user_id is also set by a column default, so a client can never
 * write rows on behalf of someone else.
 */
export class SupabaseStore implements Store {
  readonly kind = "cloud" as const;
  constructor(private db: SupabaseClient, private userId: string) {}

  async list<K extends TableName>(table: K, opts?: ListOptions<TableMap[K]>) {
    let q = this.db.from(table).select("*");
    if (opts?.eq) {
      for (const [k, v] of Object.entries(opts.eq)) q = v === null ? q.is(k, null) : q.eq(k, v as string);
    }
    q = q.order(opts?.orderBy ?? "created_at", { ascending: Boolean(opts?.ascending) });
    const { data, error } = await q;
    if (error) fail(error, "Could not load your data.");
    return (data ?? []) as TableMap[K][];
  }

  async insert<K extends TableName>(table: K, row: NewRow<TableMap[K]>) {
    const { data, error } = await this.db
      .from(table)
      .insert({ ...row, user_id: this.userId })
      .select()
      .single();
    if (error) fail(error, "Could not save.");
    return data as TableMap[K];
  }

  async update<K extends TableName>(table: K, id: string, patch: Partial<NewRow<TableMap[K]>>) {
    const { data, error } = await this.db.from(table).update(patch as Record<string, unknown>).eq("id", id).select().single();
    if (error) fail(error, "Could not update.");
    return data as TableMap[K];
  }

  async remove(table: TableName, id: string) {
    const { error } = await this.db.from(table).delete().eq("id", id);
    if (error) fail(error, "Could not delete.");
  }

  async getProfile() {
    const { data, error } = await this.db.from("profiles").select("*").eq("id", this.userId).maybeSingle();
    if (error) fail(error, "Could not load your profile.");
    return (data as Profile) ?? null;
  }

  async saveProfile(patch: Partial<Profile>) {
    const { id: _ignored, created_at: _c, updated_at: _u, ...rest } = patch;
    void _ignored; void _c; void _u;
    const { data, error } = await this.db
      .from("profiles")
      .upsert({ ...rest, id: this.userId }, { onConflict: "id" })
      .select()
      .single();
    if (error) fail(error, "Could not save your profile.");
    return data as Profile;
  }

  async exportAll() {
    const out: Record<string, unknown> = { profile: await this.getProfile() };
    for (const t of TABLES) out[t] = await this.list(t, { ascending: true });
    return out;
  }

  /** Deletes the account itself; all rows cascade from auth.users. */
  async deleteAll() {
    const { error } = await this.db.rpc("delete_my_account");
    if (error) fail(error, "Could not delete your account.");
  }
}
