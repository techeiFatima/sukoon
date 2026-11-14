/**
 * VETTED LECTURE SOURCES
 * ──────────────────────
 * This list is intentionally empty. Choosing which teachers Sukoon presents
 * is an editorial and religious decision for the Sukoon team (ideally with
 * scholarly advisers), not for the software.
 *
 * To add a channel:
 *   1. Open the channel on YouTube. Find its channel ID (starts with "UC",
 *      24 characters). It appears in URLs like youtube.com/channel/UC…, or
 *      paste the channel link into Soul → Lectures → "Add a source" and the
 *      app will look the ID up for you.
 *   2. Add an entry below. `tradition` controls who sees it by default:
 *      people who set Sunni see "sunni" + "general"; Shia see "shia" +
 *      "general"; everyone else sees all.
 *   3. Optionally tag Soul topics the channel speaks to well.
 *
 * Example (not a recommendation):
 *   {
 *     channelId: "UCxxxxxxxxxxxxxxxxxxxxxx",
 *     name: "Example Teacher",
 *     note: "Short talks on patience and gratitude. Reviewed by …",
 *     tradition: "general",
 *     language: "English",
 *     topics: ["sabr", "shukr"],
 *   },
 */
import type { Tradition } from "@/lib/types";

export interface CuratedChannel {
  channelId: string;
  name: string;
  /** Why this source is included; shown to users. */
  note: string;
  tradition: "sunni" | "shia" | "general";
  language: string;
  topics?: string[];
}

export const CURATED_CHANNELS: CuratedChannel[] = [];

export const CURATION_NOTE =
  "Sources marked “Vetted” were chosen by the Sukoon team. Inclusion is not an endorsement of every view expressed. Sources you add yourself are your own choice. For questions of practice or belief, consult a qualified scholar you trust.";

export function curatedFor(tradition: Tradition): CuratedChannel[] {
  if (tradition === "sunni" || tradition === "shia") {
    return CURATED_CHANNELS.filter((c) => c.tradition === "general" || c.tradition === tradition);
  }
  return CURATED_CHANNELS;
}

/** Deliberately small: a watch list, not a backlog. */
export const WATCHLIST_LIMIT = 5;
