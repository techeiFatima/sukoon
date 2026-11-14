import type { Experience, Profile } from "./types";
import type { Store } from "./store/types";

export interface OnboardingDraft {
  display_name: string;
  motivations: string[];
  experience: Experience;
  values: string[];
  change_note: string;
}

const KEY = "sukoon:onboarding-draft";

export function saveDraft(d: OnboardingDraft) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage unavailable */ }
}
export function loadDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OnboardingDraft) : null;
  } catch {
    return null;
  }
}
export function clearDraft() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Creates the personal space: profile + chosen values. */
export async function applyOnboarding(store: Store, d: OnboardingDraft): Promise<Profile> {
  const existing = await store.list("personal_values");
  const have = new Set(existing.map((v) => v.name.toLowerCase()));
  let pos = existing.length;
  for (const name of d.values) {
    if (have.has(name.toLowerCase())) continue;
    await store.insert("personal_values", { name, meaning: null, position: pos++ });
  }
  const profile = await store.saveProfile({
    display_name: d.display_name.trim() || null,
    motivations: d.motivations,
    experience: d.experience,
    change_note: d.change_note.trim() || null,
    onboarded_at: new Date().toISOString(),
  });
  clearDraft();
  return profile;
}
