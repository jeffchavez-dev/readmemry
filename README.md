# readmemry

Save what you're reading, annotate it, and follow what other people are reading — a social read-it-later app in the spirit of [Curius](https://curius.app). Built with Next.js (App Router), Supabase, and a companion Chrome extension.

## Features

- **Save links** from the web app, a browser share, or the Chrome extension. Each save is a personal, annotated copy of a URL — if two people save the same link, that's two separate rows, not a shared record (`source` is tracked as `web`, `pwa_share`, or `extension`).
- **Edit or remove a saved link** from your library — update the title, description, tags, or note, or delete the save entirely. Owner-only, and scoped to your own saves.
- **Auto-fetched metadata** — title, description, image, and favicon are pulled via Open Graph scraping when you paste a URL, with the fetch racing your typing so hitting Save early still resolves correctly.
- **Reader view** with Mozilla Readability-based article extraction (`src/lib/extract-article.ts`) and DOMPurify sanitization for safe rendering.
- **Highlights** — select text in the reader to save a passage-level highlight, anchored with the browser's native [Text Fragments API](https://developer.mozilla.org/en-US/docs/Web/URI/Fragment/Text_fragments) (`#:~:text=...`) instead of custom DOM anchoring. Highlighting is a personal annotation, restricted to the link's owner.
- **Comments** — open discussion threads on any visible link (separate from highlights, which stay private to the saver).
- **Tags** — a shared, global tag vocabulary (not per-user namespaces), normalized to lowercase on save.
- **Public/private links** — links default to public and are visible to signed-out visitors; toggle `is_private` to restrict a save to yourself.
- **Public profiles** at `/u/[username]`, with follow/followers/following.
- **Auth** — email/password and Google OAuth via Supabase, with a profile auto-created on signup (`handle_new_user` trigger). Google sign-ins without a chosen username get a random one, renameable later in Settings.
- **Chrome extension (MV3)** — save the current page or a text selection from any tab via a popup, context menu, or new-tab override. Since MV3 service workers can't hold a browser-session cookie, the extension authenticates with a personal access token (generated in Settings, stored as a SHA-256 hash server-side) rather than Supabase's normal session flow.
- **PWA** — installable, with a share-target handler so links shared from other apps land on `/save` pre-filled, and offline support via a service worker.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com), then run `supabase/schema.sql` in the SQL editor (or via `supabase db push`). This creates all tables, the new-user trigger, and Row Level Security policies.

Copy the env template and fill in your project's keys:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Load the Chrome extension (optional)

1. In the app, go to Settings and generate a personal access token.
2. Go to `chrome://extensions`, enable Developer mode, and "Load unpacked" from the `extension/` directory.
3. Open the extension's options page and paste in your token.

The extension is configured to talk to `localhost:3004` in dev and `*.vercel.app` in production (`extension/manifest.json` → `host_permissions`).

## Project structure

```
src/app/(app)/       Authenticated app routes: library, save/edit, settings, link + reader views, profiles
src/app/api/         Route handlers: links, highlights, metadata scraping
src/app/auth/        Supabase OAuth callback
src/components/      UI (shadcn-based), links (save/reader/comments), social (follow, tokens)
src/lib/             Article extraction, tagging, text fragments, Supabase clients, auth helpers
extension/           MV3 Chrome extension (popup, background, content script, options)
supabase/schema.sql  Full DB schema, RLS policies, and the new-user trigger
public/              PWA manifest, icons, service worker
```

## Notes for contributors

This project pins Next.js 16, which ships its own docs locally at `node_modules/next/dist/docs/` — check there before relying on Next.js knowledge from training data, since the App Router API has moved fast. See `AGENTS.md`.
