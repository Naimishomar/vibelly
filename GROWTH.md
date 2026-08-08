# Vibelly Growth Playbook

Goal: 10,000 daily users. Code can't guarantee that number, but this playbook stacks every
mechanism that converts. Do the parts marked **[YOU]** yourself (they need accounts only you
have). Everything else is already built and live.

## What's already built (in this repo)

| Asset | Where | Purpose |
|---|---|---|
| Referral engine | `backend/src/services/referral.service.ts`, `/api/referral/*` | Both sides earn 3 days Premium per invite. Your #1 viral loop. |
| Invite & Earn modal | `frontend/src/components/ReferralModal.tsx` | Accessible from navbar dropdown. |
| Post-chat share prompt | `frontend/src/components/SharePrompt.tsx` | Shown after a real chat ends. |
| `?ref=CODE` capture + auto-claim | `frontend/src/lib/referral.ts`, `App.tsx` | Any shared link with your code auto-rewards on signup. |
| Blog sitemap | `backend/src/routes/blog.routes.ts` → `/sitemap-blog.xml` proxy | Every blog post is now in the sitemap index. |
| Link-to-us page | `/backlinks` (footer link) | Copy-paste badges + embed widget for anyone who wants to link to you. |
| Embeddable widget | `frontend/public/embed.html` | Sites embed it; "Start Chatting" drives users to you. |
| Indexing gate | `DynamicSeoPage.tsx` noindex logic + `robots.txt` | Known sitemap pages index; junk never does. |

## A. Backlinks — do these this week [YOU]

> I can't post on external sites (no accounts/credentials), and mass-submitting spam would hurt
> your rankings. These take ~1 hour total. The `/backlinks` page gives you the exact HTML for each.

1. **Product Hunt / AlternativeTo / Slant** — most traffic per effort for this niche.
   - AlternativeTo: create a "Vibelly" listing (category: Random Chat), fill the description, add
     links. Sites list "alternatives to Vibelly" and reference you.
   - Slant.co: answer "What is the best Omegle alternative?" with a real review.
2. **Web directories (free, do-follow, slow to index):** Hotfrog, Foursquare, Yelp (business
   type: Internet), Bing Places, Chrome Web Store listing, Google Business Profile.
3. **GitHub + Gist:** publish the embed widget (`/embed.html`) as a reusable gist. GitHub README
   backlinks are indexed. Add `open-source` badge links in any open repos you own.
4. **Blogger/Medium/Substack:** publish 2 articles ("Best Omegle alternatives in 2026", "How to
   stay safe in random video chat") using your exact-match anchor texts from `/backlinks`, and
   link each page's canonical to a Vibelly SEO page. Medium has high authority — 2 posts here are
   worth 50 directory listings.
5. **Quora / Reddit (be genuinely useful):** answer "Omegle shut down, what's the best
   replacement?" with real advice + one link. Post on r/omegle, r/randomvideochat, r/InternetIsBeautiful.
6. **Digital PR:** DM small tech bloggers/YouTubers with the widget embed code and offer
   "use this widget, it links to you too" — reciprocal visibility.

## B. Traffic — repeat weekly [YOU]

- Post 1 short video/day on TikTok + Shorts + Reels: screen-record the app, "POV: you found the
  new Omegle." Link in bio = `https://vibelly.fun/?ref=tiktok`.
- Add the referral link to every bio: socials, YouTube, Discord servers you're in.
- Onboarding prompt to new users: "Share Vibelly with one friend → free Premium" (builds the loop).

## C. Indexing — already handled, verify after deploy

- `sitemap.xml` (index) → core, cities, competitors, trends, blog.
- `robots.txt` points to `sitemap.xml` + `sitemap-blog.xml`; private routes disallowed.
- Every sitemap URL is prerendered to static HTML (see `scripts/prerender.cjs`).
- **One manual step [YOU]:** add `sitemap.xml` in Google Search Console → Sitemaps, and
  `https://vibelly.fun/sitemap-blog.xml`. Then use URL Inspection → "Request Indexing" on the
  homepage and top 5 pages. That triggers Google to crawl the whole index.

## D. The metric that decides everything

Watch the **"Friends joined"** counter in the Invite & Earn modal. That number is your viral
coefficient. If it grows on its own → you're compounding. If it's flat → the product isn't
incentivizing shares yet; we add more (streaks, milestones) — code is ready for that.

## Backlink anchor texts (use these exact ones)

- `Omegle alternative` → `https://vibelly.fun`
- `free random video chat` → `https://vibelly.fun`
- `talk to strangers online` → `https://vibelly.fun`
