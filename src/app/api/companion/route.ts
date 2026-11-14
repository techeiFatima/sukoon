import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getProvider, ProviderError } from "@/lib/ai/provider";
import { CRISIS_RESPONSE, looksLikeCrisis } from "@/lib/ai/safety";
import { LIMITS, type ChatMessage, type Intent } from "@/lib/ai/types";
import { isCloudConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTENT_IDS: Intent[] = ["open", "pattern", "value", "goal", "learning", "day"];

// Best-effort per-instance rate limit. Use a shared store (e.g. Upstash) for multi-region production.
const hits = new Map<string, { n: number; reset: number }>();
function rateLimited(key: string, limit = 30, windowMs = 10 * 60_000) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return false; }
  h.n++;
  return h.n > limit;
}

/** Tells the client whether cloud reflection is available. Reveals nothing else. */
export async function GET() {
  return NextResponse.json({ cloudAvailable: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req: Request) {
  const provider = getProvider();
  if (!provider) return NextResponse.json({ error: "Cloud reflection is not configured on this server." }, { status: 503 });

  // When accounts exist, only signed-in users may use the API key.
  let who = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (isCloudConfigured) {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Please sign in to use cloud reflection." }, { status: 401 });
    const sb = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    who = data.user.id;
  }
  if (rateLimited(who)) return NextResponse.json({ error: "Let’s slow down a little. Try again in a few minutes." }, { status: 429 });

  let body: { messages?: unknown; intent?: unknown; consent?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (body.consent !== true) return NextResponse.json({ error: "Consent is required before messages are sent to the AI service." }, { status: 403 });

  const intent: Intent = INTENT_IDS.includes(body.intent as Intent) ? (body.intent as Intent) : "open";
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > LIMITS.maxMessages) {
    return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
  }
  const messages: ChatMessage[] = [];
  for (const m of body.messages) {
    const role = (m as ChatMessage)?.role;
    const content = (m as ChatMessage)?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim() || content.length > LIMITS.maxChars) {
      return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    }
    messages.push({ role, content });
  }
  // The API requires the conversation to start with a user turn; drop a leading opener.
  const openers: string[] = [];
  while (messages.length && messages[0].role === "assistant") openers.push(messages.shift()!.content);
  if (!messages.length || messages[messages.length - 1].role !== "user") return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });

  const last = messages[messages.length - 1].content;
  if (looksLikeCrisis(last)) return NextResponse.json({ reply: CRISIS_RESPONSE, safety: true });

  try {
    const reply = await provider.reply(messages, intent, openers.join(" ").slice(0, 500) || undefined);
    // Nothing is logged or stored: the conversation lives only in the person's browser tab.
    return NextResponse.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const err = e instanceof ProviderError ? e : new ProviderError("Something went wrong.");
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
