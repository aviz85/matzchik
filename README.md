# מצחיק — מאחורי הפאנץ׳

Hebrew, RTL social workspace for stand-up comedians. React + TypeScript + Vite, hosted on Vercel. Supabase supplies authentication, PostgreSQL and image storage.

## Design: בלי פילטר

The implemented visual direction is proposal 2: a bold independent comedy magazine. An oversized Hebrew masthead, warm paper texture, black editorial rules, acid-yellow labels and electric-blue actions replace the earlier card dashboard. Desktop uses staggered story columns, a writing rail and a creator index; phones show a readable single-column edition with a collapsible menu. Auth, composer and profile dialogs follow the same visual system and support Escape/focus containment.

Heebo is bundled locally through `@fontsource-variable/heebo`; the UI no longer requests fonts from Google. `public/images/stage.webp` is an AI-generated empty-stage illustration used in the masthead and explicitly labeled demo material. It is not a photograph of a real user's performance. The microphone, notebook and fictional demo portraits are also generated assets, encoded as WebP for delivery. Real authenticated profiles continue to use initials when no portrait is supplied. Uploaded user images retain their colors and proportions.

## Current status

The deployed site runs in **clearly labeled demonstration mode** until Supabase is configured. Demo content is fictional. Registration, publication, comments and reactions are intentionally disabled in demo mode. Bookmarks are saved locally in the current browser. No shared-user workflow has been validated against a live database yet.

## Local development

Use the existing isolated checkout; do not create a Git worktree for ordinary tasks.

```sh
cd /workspace/matzchik
npm ci
npm run dev
npm run build
npm test
npx playwright test
```

Browser tests use `/usr/bin/chromium`. Set `TEST_URL` to test the deployed demo instead of localhost. No application server or database process is needed locally: the client connects to Supabase when configured. Node 24 is supported.

## Enable the real community

1. Create a new project at https://supabase.com/dashboard (select a suitable region and retain the database password securely). This is an external prerequisite; no Supabase account-management credential is available in this environment.
2. Run `supabase/schema.sql` in that project's SQL Editor. The migration creates profiles, posts, comments, unique reactions, reports and the image bucket, with row-level security. It is repeatable.
3. In Authentication → URL Configuration set Site URL to `https://matzchik.vercel.app`. Allow that exact URL as a redirect. Add `http://localhost:5173` only for development.
4. Enable email confirmation. Configure production SMTP and CAPTCHA before public invitations. Use verified emails to prevent impersonation; profiles are self-selected stage names, not verified identities.
5. From project settings copy the Project URL and **publishable/anon key**. Never use a service-role or secret key in the frontend.
6. In Vercel → matzchik → Settings → Environment Variables add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production (and Preview if wanted), then redeploy. Vite embeds public configuration at build time, so merely updating runtime values is insufficient.
7. For local work copy `.env.example` to `.env.local` and fill the same public values. Restart Vite.
8. Validate with two confirmed test users: publish text and a JPG/PNG/WebP ≤5MB; log in as the second user and comment/react; ensure the second user cannot delete the first user's post or update their profile; verify persistence after reload and verify deletion by the author. Check reports in the Supabase dashboard. These checks remain outstanding until a database exists.

## Product scope

Feed categories (punchline/idea/material), search, composer, profile editing, comments, one support reaction per user per post, local bookmarks, profile feeds, own-post deletion and reporting. Reports are reviewable in Supabase by the project owner; there is no automatic moderation or dedicated admin UI. Image upload validates file type and size; the bucket enforces these limits too. Text is rendered as plain text by React.

Post text and profiles are restricted to authenticated community members. **Images use a private bucket** and signed URLs valid for one hour. Signed-in members can view community images; anyone receiving a copied signed URL can view it until it expires. Members can still copy material, so this is not a confidential vault. RLS prevents users from inserting or deleting another user's records. A deleted post cascades to comments, reactions and reports. UI deletion also removes its image where possible; orphan image cleanup and account deletion require admin handling.

This is an initial MVP, not a fully operated public service. Before opening broadly, add an owner-operated moderation process, abuse rate limits, account recovery/deletion flows, privacy terms, and backups appropriate to the intended audience.

## Deployment

Vercel project: `matzchik`; production alias: https://matzchik.vercel.app . `vercel.json` sets build/SPA routing/security headers. Deploy via Vercel or its CLI using supported authentication. Never put the deployment token in source files or frontend build variables. The initial deployment was uploaded through Vercel's authenticated API, without modifying any existing project.

## Screenshot review

The selected 1536×1024 concept was compared with a screenshot of the deployed site. The correction reduced the desktop feed start from 633px to 368px, restored the complete masthead, moved the leading punchline to the left of the image story, and placed a compact idea beneath the yellow writing panel. Existing comments now have a preview and open into the original full comment form. The main categories run across the page and the illustration assets follow the original art direction. A browser regression check guards the masthead bounds, column ordering and above-fold discussion visibility.
