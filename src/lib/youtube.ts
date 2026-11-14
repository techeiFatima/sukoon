import "server-only";

/**
 * Reads YouTube's public per-channel Atom feed
 * (https://www.youtube.com/feeds/videos.xml?channel_id=…). No API key, no
 * user data sent: only the channel ID. Only youtube.com URLs built from
 * validated IDs are ever fetched.
 */

export interface FeedVideo {
  videoId: string;
  title: string;
  channelId: string;
  channelName: string;
  publishedAt: string | null;
}

export interface ChannelFeed {
  channelId: string;
  channelName: string;
  videos: FeedVideo[];
}

export const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const HANDLE = /^@?[A-Za-z0-9._-]{3,40}$/;

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function tag(xml: string, name: string): string | null {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : null;
}

/** Parses a YouTube channel Atom feed. Shorts are skipped: Sukoon is for listening, not scrolling. */
export function parseFeed(xml: string, channelId: string): ChannelFeed {
  const head = xml.split("<entry")[0];
  const channelName = tag(head, "title") ?? "YouTube channel";
  const videos: FeedVideo[] = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const videoId = tag(e, "yt:videoId");
    const title = tag(e, "title");
    if (!videoId || !VIDEO_ID.test(videoId) || !title) continue;
    if (/href="[^"]*\/shorts\//.test(e)) continue;
    const published = tag(e, "published");
    videos.push({
      videoId,
      title,
      channelId,
      channelName: tag(e, "name") ?? channelName,
      publishedAt: published && !Number.isNaN(Date.parse(published)) ? new Date(published).toISOString() : null,
    });
  }
  return { channelId, channelName, videos };
}

export async function fetchChannel(channelId: string): Promise<ChannelFeed> {
  if (!CHANNEL_ID.test(channelId)) throw new Error("Invalid channel ID.");
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "application/atom+xml" },
  });
  if (res.status === 404) throw new Error("That channel couldn’t be found.");
  if (!res.ok) throw new Error(`YouTube responded with ${res.status}.`);
  return parseFeed(await res.text(), channelId);
}

/**
 * Turns what a person pastes (a channel ID, a /channel/ URL, an @handle or
 * an @handle URL) into a channel ID. Handles are resolved by reading the
 * channel page's canonical link; that is best-effort.
 */
export async function resolveChannelId(input: string): Promise<string> {
  const raw = input.trim();
  const direct = raw.match(/(UC[A-Za-z0-9_-]{22})/);
  if (direct && (CHANNEL_ID.test(raw) || /\/channel\//.test(raw))) return direct[1];

  let handle: string | null = null;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      const seg = u.pathname.split("/").filter(Boolean)[0] ?? "";
      if (seg.startsWith("@")) handle = seg;
    }
  } catch { /* not a URL */ }
  if (!handle && HANDLE.test(raw)) handle = raw.startsWith("@") ? raw : `@${raw}`;
  if (!handle || !HANDLE.test(handle)) throw new Error("Paste a YouTube channel link, like youtube.com/@name or youtube.com/channel/UC…");

  const res = await fetch(`https://www.youtube.com/${encodeURIComponent(handle).replace("%40", "@")}`, {
    signal: AbortSignal.timeout(8000),
    headers: { "Accept-Language": "en" },
  });
  if (!res.ok) throw new Error("That channel couldn’t be found.");
  const html = await res.text();
  const m =
    html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/) ??
    html.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/) ??
    html.match(/"channelId":"(UC[A-Za-z0-9_-]{22})"/);
  if (!m) throw new Error("Couldn’t read that channel’s ID. Try its youtube.com/channel/UC… link instead.");
  return m[1];
}
