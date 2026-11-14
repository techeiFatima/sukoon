"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useApp } from "@/lib/app-context";
import type { AiMode, Experience, Tradition } from "@/lib/types";
import { TRADITION_POLICY } from "@/content/islamic";
import { Button, Chip, cx, ErrorNote, Label, PageHeader, SavedHint, TextArea } from "@/components/ui";

export default function Settings() {
  const { profile, updateProfile, mode, session, signOut, store } = useApp();
  const router = useRouter();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [change, setChange] = useState(profile?.change_note ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [cloudAvailable, setCloudAvailable] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetch("/api/companion").then((r) => r.json()).then((d) => setCloudAvailable(Boolean(d.cloudAvailable))).catch(() => {}); }, []);
  useEffect(() => { if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView(); }, []);

  if (!profile || !store) return null;

  async function save(patch: Parameters<typeof updateProfile>[0]) {
    setState("saving");
    try { await updateProfile(patch); setState("saved"); } catch (e) { setState("error"); setError(e instanceof Error ? e.message : "Could not save."); }
  }

  async function exportData() {
    const data = await store!.exportAll();
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), app: "Sukoon", ...data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sukoon-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteEverything() {
    setDeleting(true);
    setError(null);
    try {
      await store!.deleteAll();
      await signOut();
      // Full reload so every in-memory cache is discarded after deletion.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/welcome";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete your data.");
      setDeleting(false);
    }
  }

  const AI_OPTIONS: { id: AiMode; label: string; body: string; disabled?: boolean }[] = [
    { id: "off", label: "Off", body: "No companion. Sukoon works fully without it." },
    { id: "local", label: "On-device guide", body: "Reflective questions generated in your browser. Nothing leaves your device." },
    { id: "cloud", label: "Claude (cloud)", body: cloudAvailable ? "Messages you type in the companion are sent to Anthropic’s API. Your journal is never included." : "Not configured on this installation.", disabled: !cloudAvailable },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Settings" title="Your space, your rules" />
      <ErrorNote>{error}</ErrorNote>

      <Section title="You">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="s-name">Name</Label>
            <input id="s-name" className="field" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== (profile.display_name ?? "") && save({ display_name: name.trim() || null })} maxLength={40} />
          </div>
        </div>
        <div className="mt-6">
          <Label htmlFor="s-change" hint="From your welcome">What you said you’d like to change</Label>
          <TextArea id="s-change" minRows={2} value={change} onChange={(e) => setChange(e.target.value)} onBlur={() => change !== (profile.change_note ?? "") && save({ change_note: change.trim() || null })} maxLength={1000} />
        </div>
        <div className="mt-2 h-4"><SavedHint state={state} /></div>
      </Section>

      <Section title="Experience">
        <div className="flex flex-wrap gap-2">
          {([["islamic", "Islamic experience"], ["general", "General experience"]] as [Experience, string][]).map(([id, l]) => (
            <Chip key={id} selected={profile.experience === id} onClick={() => save({ experience: id })}>{l}</Chip>
          ))}
        </div>
        {profile.experience === "islamic" && (
          <div className="mt-8">
            <p className="mb-3 text-[13px] font-medium text-ink">Scholarly tradition</p>
            <div className="flex flex-wrap gap-2">
              {([["unspecified", "Prefer not to say"], ["sunni", "Sunni"], ["shia", "Shia"], ["both", "Show notes from both"]] as [Tradition, string][]).map(([id, l]) => (
                <Chip key={id} selected={profile.tradition === id} onClick={() => save({ tradition: id })}>{l}</Chip>
              ))}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-muted">{TRADITION_POLICY}</p>
          </div>
        )}
      </Section>

      <Section title="Reflection companion" id="ai">
        <div className="grid gap-3">
          {AI_OPTIONS.map((o) => (
            <button
              key={o.id}
              disabled={o.disabled}
              aria-pressed={profile.ai_mode === o.id}
              onClick={() => (o.id === "cloud" && !profile.ai_consent_at ? router.push("/companion") : save({ ai_mode: o.id }))}
              className={cx("rounded-2xl border p-5 text-left transition-colors disabled:opacity-50", profile.ai_mode === o.id ? "border-forest bg-forest text-ivory" : "border-line bg-paper hover:border-sage")}
            >
              <p className="font-medium">{o.label}</p>
              <p className={cx("mt-1 text-sm", profile.ai_mode === o.id ? "text-ivory/75" : "text-muted")}>{o.body}</p>
            </button>
          ))}
        </div>
        {profile.ai_consent_at && (
          <p className="mt-4 text-[12px] text-muted">
            You consented to cloud reflection on {new Date(profile.ai_consent_at).toLocaleDateString()}.{" "}
            <button className="underline underline-offset-4 hover:text-forest" onClick={() => save({ ai_mode: profile.ai_mode === "cloud" ? "local" : profile.ai_mode, ai_consent_at: null })}>Withdraw consent</button>
          </p>
        )}
      </Section>

      <Section title="Storage and account" id="storage">
        {mode === "local" ? (
          <div className="rounded-2xl border border-sand bg-sand-soft/50 p-5 text-sm leading-relaxed text-ink">
            <p className="font-medium">Local mode</p>
            <p className="mt-1 text-muted">Everything you write is stored only in this browser’s local storage. It isn’t sent to any server, isn’t synced to other devices, and will be lost if you clear your browser data. Export regularly if it matters to you. To enable accounts and sync, configure Supabase (see the README).</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted">Signed in as <span className="text-ink">{session?.user.email}</span>. Your data is stored in a private database protected by row-level security — only you can read it.</p>
            <Button variant="secondary" onClick={async () => { await signOut(); router.replace("/auth"); }}>Sign out</Button>
          </div>
        )}
      </Section>

      <Section title="Your data">
        <p className="mb-5 text-sm leading-relaxed text-muted">Everything you’ve written belongs to you. Take a complete copy whenever you like.</p>
        <Button variant="secondary" onClick={exportData}><Download size={15} /> Export everything (JSON)</Button>

        <div className="mt-10 rounded-2xl border border-clay/25 p-6">
          <p className="font-medium text-clay">{mode === "cloud" ? "Delete account and all data" : "Delete all data"}</p>
          <p className="mt-1 text-sm text-muted">This permanently removes {mode === "cloud" ? "your account and" : ""} every reflection, note, and goal. It cannot be undone.</p>
          <label htmlFor="del" className="mt-5 block text-[13px] text-ink">Type <strong>delete</strong> to confirm</label>
          <div className="mt-2 flex gap-3">
            <input id="del" className="field max-w-[200px]" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
            <Button variant="danger" disabled={confirmText.trim().toLowerCase() !== "delete"} loading={deleting} onClick={deleteEverything}>Delete permanently</Button>
          </div>
        </div>
      </Section>

      <Section title="Our promises">
        <ul className="space-y-3 text-[15px] leading-relaxed text-ink">
          {[
            "Private by default. There are no public profiles, feeds, or follower counts.",
            "No advertising, no trackers, no third-party analytics.",
            "We will never optimise for how long you spend here.",
            "Your journal is never used for recommendations and never sent to AI.",
            "Religious content is curated by hand and sourced; Sukoon never issues religious rulings.",
          ].map((p) => <li key={p} className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />{p}</li>)}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-10">
      <h2 className="mb-6 text-[1.5rem] text-forest">{title}</h2>
      {children}
    </section>
  );
}
