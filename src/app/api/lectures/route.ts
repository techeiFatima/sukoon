import { NextResponse } from "next/server";
import { CHANNEL_ID, fetchChannel, resolveChannelId, type ChannelFeed } from "@/lib/youtube";

export const runtime = "nodejs";

const MAX_CHANNELS = 25;
const PER_CHANNEL = 4;

/** GET /api/lectures?channels=UC…,UC… → a few recent lectures per channel. */
export async function GET(req: Request) {
  const ids = [...new Set((new URL(req.url).searchParams.get("channels") ?? "").split(",").map((s) => s.trim()).filter(Boolean))];
  if (ids.length === 0) return NextResponse.json({ channels: [], errors: [] });
  if (ids.length > MAX_CHANNELS || ids.some((id) => !CHANNEL_ID.test(id))) {
    return NextResponse.json({ error: "Invalid channel list." }, { status: 400 });
  }
  const results = await Promise.allSettled(ids.map(fetchChannel));
  const channels: ChannelFeed[] = [];
  const errors: { channelId: string; error: string }[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") channels.push({ ...r.value, videos: r.value.videos.slice(0, PER_CHANNEL) });
    else errors.push({ channelId: ids[i], error: r.reason instanceof Error ? r.reason.message : "Unavailable" });
  });
  return NextResponse.json({ channels, errors }, { headers: { "Cache-Control": "private, max-age=600" } });
}

/** POST { input } → { channelId, name } for a pasted channel link or handle. */
export async function POST(req: Request) {
  let input: unknown;
  try { input = (await req.json())?.input; } catch { input = null; }
  if (typeof input !== "string" || !input.trim() || input.length > 200) {
    return NextResponse.json({ error: "Paste a YouTube channel link." }, { status: 400 });
  }
  try {
    const channelId = await resolveChannelId(input);
    const feed = await fetchChannel(channelId);
    return NextResponse.json({ channelId, name: feed.channelName });
  } catch (e) {
    const message = e instanceof Error && !/fetch failed|aborted|timeout/i.test(e.message) ? e.message : "YouTube couldn’t be reached. Please try again.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
