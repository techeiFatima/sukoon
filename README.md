# Sukoon

**Technology for a more intentional life.** Less noise. More meaning.

Sukoon (سُكُون, *stillness*) is an intentional-living app. Most apps are built to capture attention; Sukoon is built to help people reclaim it. It works if people spend *less* time in it over time.

It is designed first for Muslim university students and young adults, with Islamic spirituality as a foundation, and offers a general experience for anyone.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment variables, Sukoon runs in **Local Mode**: fully usable, with all data kept in this browser's `localStorage`. A "Local mode" badge in the header makes this visible.

## Two storage modes

| | Local Mode | Cloud Mode |
|---|---|---|
| Enabled when | Supabase env vars are absent | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set |
| Accounts | None | Email + password (Supabase Auth) |
| Data lives in | This browser only | Postgres, isolated per user by Row Level Security |
| Sync across devices | No | Yes |
| Export / delete | Yes (Settings) | Yes; deletion removes the account and cascades all rows |

Both modes go through one interface (`src/lib/store/types.ts`), so every screen behaves the same in either mode.

## Environment variables

Copy `.env.example` to `.env.local`. Every variable is optional.

| Variable | Where it's used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Turns on Cloud Mode. Public by design; RLS enforces access. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Supabase anon (public) key. **Never** use the service-role key here. |
| `ANTHROPIC_API_KEY` | Server only | Enables cloud reflection with Claude. Never prefix with `NEXT_PUBLIC_`. |
| `ANTHROPIC_MODEL` | Server only | Optional. Defaults to `claude-opus-5-5`. |

## Setting up Supabase (Cloud Mode)

1. Create a project at supabase.com.
2. Apply the migration in `supabase/migrations/`, either with the Supabase CLI (`supabase link` then `supabase db push`) or by pasting the SQL into the SQL editor.
3. Under **Authentication → URL Configuration**, set the Site URL to your deployment URL and add `http://localhost:3000` as a redirect URL for development.
4. Put the project URL and anon key in `.env.local` and restart.

Email confirmation can stay on. If someone completes onboarding before confirming, their answers wait on the device and are applied when they first sign in.

### Database and security

`supabase/migrations/20261114000000_init.sql` creates `profiles` (extending `auth.users`) and these tables: `daily_intentions`, `reflections`, `attention_checkins`, `personal_values`, `commitments`, `learning_journeys`, `knowledge_notes`, `knowledge_connections`, `saved_resources`, `personal_goals`, plus supporting tables `diet_items`, `boundaries`, `focus_sessions`, `offline_actions`, `alignment_reflections`, `lecture_sources` and `saved_lectures`. Apply both files in `supabase/migrations/` in order.

- RLS is enabled and forced on every table. Each table has select/insert/update/delete policies restricted to `user_id = auth.uid()`, and `anon` has no grants.
- `user_id` defaults to `auth.uid()`, and the insert/update checks stop anyone from writing rows as another user or moving a row to someone else.
- Triggers make sure knowledge connections and alignment reflections only point at the user's own notes and values.
- A check constraint blocks `ai_mode = 'cloud'` unless consent has been recorded.
- `delete_my_account()` is a narrowly scoped `security definer` function. It can only delete the caller, and all their rows cascade.

**Run the RLS test suite** (needs a local PostgreSQL 14+ install; no Supabase required):

```bash
npm run test:rls
```

It starts a throwaway Postgres, adds a minimal stand-in for Supabase's `auth` schema, applies the migration, and runs 22 checks covering cross-user reads and writes, forged `user_id`, row transfer, anon access, the consent constraint, the lecture watch-list cap, and account deletion.

## AI reflection companion

AI supports the product; it isn't the centre of it. The companion asks questions more than it gives advice.

- **Off:** fully supported, and the app works without it.
- **On-device guide (default):** a hand-written set of reflective questions that runs entirely in the browser (`src/lib/ai/localGuide.ts`). It never sends text anywhere. It is explicitly *not* a language model. For "turn a vague goal into steps", it walks through four questions and builds a plan from the person's own words, which they can save to Goals.
- **Claude (cloud):** available only when `ANTHROPIC_API_KEY` is set **and** the person gives explicit in-app consent, which is recorded in `profiles.ai_consent_at` and can be withdrawn in Settings.

Privacy rules that the code enforces:

- Only messages typed in the companion are sent. Journals, reflections, check-ins and other data are never included.
- Conversations are held in memory in the browser tab and are never stored by Sukoon.
- The API route (`src/app/api/companion/route.ts`) refuses requests without `consent: true`. In Cloud Mode it also requires a valid Supabase session. It validates message shape and size and applies a per-user rate limit.
- The key stays on the server. The client only learns whether cloud reflection is available.

Safety: the system prompt (`src/lib/ai/prompt.ts`) forbids shaming, diagnosing, judging someone's spiritual state, issuing religious rulings, citing scripture (to avoid misquotation), and claiming to be a scholar or therapist. Crisis language is caught *before* any model call, and the reply points to people and crisis lines instead. The on-device guide has the same checks. Replies from Claude are labelled as AI-generated. The provider sits behind a small `ReflectionProvider` interface (`src/lib/ai/provider.ts`), so another model or vendor can be swapped in. It uses the Anthropic SDK with low effort (suited to short conversational turns), server-side refusal fallback, and a cached system prompt.

## Religious content

All Islamic content is curated by hand in `src/content/islamic.ts`. None of it is generated.

- Qur'an translations are Saheeh International, with surah:ayah references that link to quran.com. Arabic is included only for short, well-known passages, with mushaf-style ayah markers.
- Hadith come from major collections and use common sunnah.com numbering. Gradings are stated where the collection's compiler or a well-known later scholar graded the narration. A statement of ʿUmar is labelled as such and not attributed to the Prophet ﷺ.
- **Sunni/Shia:** people can set their tradition in Settings. The current hadith references are from collections central to Sunni scholarship. The app says so plainly, notes that Shia scholarship uses its own collections (such as al-Kafi), and points to classical works from both traditions (al-Ghazali's *Iḥyāʾ*, al-Naraqi's *Jāmiʿ al-Saʿādāt*) instead of adding Shia hadith without review.
- The app shows a notice that the content has not yet been reviewed by a panel of scholars. **Have qualified scholars review this file before a public launch.**

"Thought of the day" quotations (`src/content/thoughts.ts`) are real and attributed, with a note where wording depends on the translation.

## Lecture library

Soul → Lectures shows a few recent talks from vetted channels and from channels the person adds. It is built to support action, not consumption:

- **No feed.** Only the 3–4 most recent talks per source are shown. YouTube Shorts are skipped. There is no autoplay and no recommendations.
- **The watch list holds 5 at most.** This is enforced in the UI and by a database trigger.
- **Every lecture ends with a question:** *"What is one thing you'll practise this week?"* The answer is kept, and can be added to Today's commitments with one click. Lectures can be linked to Soul topics, where they appear alongside the person's notes.
- **Privacy.** Videos play in YouTube's privacy-enhanced player (`youtube-nocookie.com`). The server reads YouTube's public per-channel RSS/Atom feed, which needs no API key and sends no user data, and caches it for an hour.

**Adding vetted sources.** `src/content/lectures.ts` ships with an **empty** vetted list on purpose: choosing which teachers Sukoon presents is an editorial and religious decision. The file explains the format. Each entry has a `tradition` (`sunni`, `shia` or `general`), which filters what people see according to the tradition they set in Settings, a note explaining why the source is included, and optional Soul topics.

**Not verified yet:** live fetching from YouTube was not tested in development, because the build sandbox could not reach youtube.com. The feed parser is tested against a sample feed in YouTube's format (`npm run test:unit`), and the UI was tested with stubbed API responses. Check that adding a channel works once you deploy. Resolving `@handle` links relies on reading the channel page and may break if YouTube changes its markup; pasting a `youtube.com/channel/UC…` link always works. Also review YouTube's Terms of Service for embedding and feed use before a public launch.

## Features

**Onboarding:** a six-step welcome covering motivations, experience, values, what the person would like to change, and creating their space. In Cloud Mode the last step is account creation.

**Today:** a time-aware greeting, one daily intention, a daily reflection question (autosaved and private), a small set of commitments (bring yesterday's forward or let them go, with no streaks), a thought of the day, and a closing line that encourages the person to leave the app.

**Mind**
- Attention check-ins across ten categories, with optional notes and a private seven-day chart.
- An information diet: editable "more of" and "less of" lists.
- Digital boundaries, plus a focus timer that survives a page reload and asks for a reflection afterwards. The app states plainly that it can't block other apps.
- "Return to the present": a full-screen, four-step guided reset (pause, breathe, notice, decide).

**Soul**
- Islamic journey: 10 topics (Niyyah, Taqwa, Muhasabah, Muraqabah, Tazkiyah, Sabr, Shukr, Tawakkul, Zuhd, Ihsan). Each has an explanation, Qur'an passages, hadith, notes across traditions, questions to sit with, practices that can be added to today's commitments, and autosaved private notes.
- Lectures: a small library of talks from trusted YouTube channels (see below).
- Personal journal: five prompts, a calendar of past entries, search, and editing.

**Intellect**
- Learning journeys: objective, current understanding, a topic checklist with progress, linked resources, ideas, and post-session reflections ("What did you understand today that you didn't understand yesterday?").
- Knowledge garden: notes with tags and collections, labelled connections between ideas, search and filters, and a constellation graph with a list view.
- Reading library: books, articles, papers, lectures, videos and quotations, grouped into collections, with reading status and search.

**My Life**
- Values: what each one means in practice, with reordering.
- Life alignment: what I value beside how I spend my time, informed by the person's own check-ins, focus minutes and offline moments. There are no scores.
- Goals across six areas, each with small steps, and the option to complete or release them.
- Offline life: ideas for real-world actions and a private record of the ones done.

**Settings:** name, experience, tradition, companion mode and consent, storage mode, sign out, JSON export, and permanent deletion.

**Across the app:** create, edit and delete everywhere; loading, empty and error states; optimistic updates with rollback; a responsive layout with a mobile tab bar; skip link, focus-visible styles, labelled controls, aria roles for tabs, switches, checkboxes and dialogs, focus-trapped modals, and reduced-motion support; strict security headers (CSP, no referrer); no analytics or trackers.

## Project structure

```
src/
  app/                 Next.js App Router pages
    (app)/             Authenticated shell: today, mind, soul, intellect, life, companion, settings
    welcome/ auth/     Onboarding and sign-in
    api/companion/     Server-side AI endpoint
  components/          UI primitives (ui.tsx) and section components
  content/             Curated Islamic content, quotations, prompts
  lib/
    store/             Store interface + LocalStore + SupabaseStore
    ai/                Provider abstraction, prompt, on-device guide, safety checks
supabase/
  migrations/          SQL schema + RLS
  tests/               RLS test suite and Supabase stub
scripts/test-rls.sh    Runs the RLS suite against a throwaway Postgres
```

Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Recharts, Supabase, and the Anthropic SDK. Fonts (Newsreader, Inter, Amiri) are self-hosted through Fontsource, so no requests go to font CDNs.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint (Next + React Compiler rules) |
| `npm run test:rls` | Database security tests |
| `npm run test:unit` | YouTube feed parser test |

## Deploying to Vercel

1. Import the repository in Vercel. The framework is detected automatically.
2. Add the environment variables above. Leave the Supabase variables empty if you want a Local Mode demo.
3. Add the deployment URL to Supabase's auth redirect URLs.
4. Deploy. The CSP in `next.config.ts` automatically allows your Supabase project.

## What needs external credentials or further work

- **Supabase project:** required for accounts, sync, and server-side storage.
- **Anthropic API key:** required for cloud reflection. Without it, the on-device guide is used.
- **Scholarly review** of `src/content/islamic.ts`, and curated references from Shia hadith collections.
- **Vetted lecture channels** in `src/content/lectures.ts` (empty by design), plus a live test of YouTube feed fetching.
- **Distributed rate limiting:** the API limiter is per-instance and in memory. Use a shared store (for example Redis) for multi-region production.
- **App blocking or screen-time data:** not possible on the web. It would need native iOS (Screen Time API) or Android integrations.
- **OAuth sign-in (Google or Apple)** and **end-to-end encryption** of journals: not implemented. Today, cloud reflections are protected by RLS and Supabase's encryption at rest, but not by client-side encryption.
- **Wellbeing measurement:** optional, private self-reports (attention, alignment, perceived wellbeing) to evaluate whether Sukoon is helping, in place of engagement metrics.
