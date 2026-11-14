"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase-client";
import { LocalStore } from "./store/local";
import { SupabaseStore } from "./store/supabase";
import type { Store } from "./store/types";
import type { Profile } from "./types";
import { applyOnboarding, loadDraft } from "./onboarding";

export type Mode = "local" | "cloud";

interface AppState {
  ready: boolean;
  mode: Mode;
  store: Store | null;
  session: Session | null;
  profile: Profile | null;
  error: string | null;
  updateProfile: (patch: Partial<Profile>) => Promise<Profile>;
  reloadProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const mode: Mode = supabase ? "cloud" : "local";
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const userId = session?.user.id ?? null;
  const store = useMemo<Store | null>(() => {
    if (!supabase) return new LocalStore();
    return userId ? new SupabaseStore(supabase, userId) : null;
  }, [supabase, userId]);

  const loadProfile = useCallback(async () => {
    if (!store) {
      setProfile(null);
      setProfileReady(true);
      return;
    }
    try {
      let p = await store.getProfile();
      // A cloud sign-up may have completed onboarding before the account existed.
      if ((!p || !p.onboarded_at) && store.kind === "cloud") {
        const draft = loadDraft();
        if (draft) p = await applyOnboarding(store, draft);
      }
      setProfile(p);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong loading your space.");
    } finally {
      setProfileReady(true);
    }
  }, [store]);

  useEffect(() => {
    if (!authReady) return;
    setProfileReady(false);
    void loadProfile();
  }, [authReady, loadProfile]);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!store) throw new Error("Please sign in first.");
      const next = await store.saveProfile(patch);
      setProfile(next);
      return next;
    },
    [store],
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
  }, [supabase]);

  const value: AppState = {
    ready: authReady && profileReady,
    mode,
    store,
    session,
    profile,
    error,
    updateProfile,
    reloadProfile: loadProfile,
    signOut,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}

/** For screens rendered inside the authenticated shell, where a store always exists. */
export function useStore(): Store {
  const { store } = useApp();
  if (!store) throw new Error("No store available — the app shell should have redirected.");
  return store;
}
