// Run: npm run test:unit
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { parseFeed } from "../src/lib/youtube.ts";

const xml = readFileSync(new URL("./fixtures/youtube-feed.xml", import.meta.url), "utf8");
const feed = parseFeed(xml, "UCaaaaaaaaaaaaaaaaaaaaaa");

assert.equal(feed.channelName, "Example Teacher & Friends", "channel name decoded");
assert.equal(feed.videos.length, 2, "shorts and malformed entries skipped");
assert.equal(feed.videos[0].videoId, "AbCdEfGhIj1");
assert.equal(feed.videos[0].title, "On Patience — \"Sabr\" in Daily Life", "entities decoded");
assert.equal(feed.videos[0].channelName, "Example Teacher & Friends");
assert.equal(feed.videos[0].publishedAt, "2026-11-10T18:00:00.000Z");
assert.equal(feed.videos[1].title, "Gratitude & Contentment", "CDATA handled");
assert.equal(feed.videos[1].channelName, "Example Teacher & Friends", "falls back to feed title");
console.log("youtube parser: all assertions passed");
