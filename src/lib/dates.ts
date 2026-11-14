/** YYYY-MM-DD in the user's local time zone. */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function lastNDates(n: number, end: Date = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => localDate(addDays(end, i - (n - 1))));
}

export function formatLongDate(d: Date = new Date()): string {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export function formatShortDate(s: string): string {
  return parseLocalDate(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatRelative(iso: string): string {
  const d = new Date(iso);
  const today = localDate();
  const ds = localDate(d);
  if (ds === today) return "Today";
  if (ds === localDate(addDays(new Date(), -1))) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

export function greeting(d: Date = new Date()): { salutation: string; line: string } {
  const h = d.getHours();
  if (h < 5) return { salutation: "Still awake", line: "The night is quiet. Be gentle with yourself." };
  if (h < 12) return { salutation: "Good morning", line: "Take a moment to return to yourself." };
  if (h < 17) return { salutation: "Good afternoon", line: "Pause. What deserves your attention now?" };
  if (h < 21) return { salutation: "Good evening", line: "Look back on the day with honesty and kindness." };
  return { salutation: "Good night", line: "Let the day settle. Tomorrow is a new page." };
}

/** Stable index for "of the day" content. */
export function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}
