/**
 * Lightweight safety checks shared by the on-device guide and the server.
 * These are deliberately conservative: when in doubt, respond with care and
 * point toward real people.
 */

const CRISIS = [
  /\b(kill|hurt|harm)\s+(myself|me)\b/i,
  /\bsuicid/i,
  /\bend (it all|my life)\b/i,
  /\b(don'?t|do not) want to (live|be alive|exist)\b/i,
  /\bself[- ]?harm/i,
  /\bno reason to live\b/i,
];

export function looksLikeCrisis(text: string): boolean {
  return CRISIS.some((r) => r.test(text));
}

export const CRISIS_RESPONSE =
  "I’m really glad you told me. What you’re carrying sounds heavy, and you deserve support from a real person right now — not an app. " +
  "If you might act on these thoughts, please contact your local emergency number. In the US, you can call or text 988 (Suicide & Crisis Lifeline); elsewhere, findahelpline.com lists free, confidential lines in many countries. " +
  "Is there someone you trust — a friend, family member, counsellor, or imam — you could reach out to today?";

const RULING = /\b(is it (halal|haram|permissible|allowed|sinful)|fatwa|ruling on|halal or haram|am i (sinful|going to hell))\b/i;
export function asksForRuling(text: string): boolean {
  return RULING.test(text);
}

const DIAGNOSIS = /\b(do i have|diagnos|am i (depressed|bipolar|autistic)|is this (adhd|ocd|depression|anxiety disorder))\b/i;
export function asksForDiagnosis(text: string): boolean {
  return DIAGNOSIS.test(text);
}
