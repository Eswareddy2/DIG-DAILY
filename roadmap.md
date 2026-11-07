# ViralSuperMart — Roadmap

## Done
- [x] Newspaper UI: home, live feed, categories, article, digest, search
- [x] Auth page + admin control center (/admin) with story/source/digest management panels
- [x] Collector engine (14 sources), secure cron endpoint, 2-min pg_cron
- [x] Article read tracking + /admin reader analytics
- [x] PWA manifest + icons + favicon, SEO metadata
- [x] Domain: https://viralsupermart.com
- [x] HTML entity decoding (collector + data layer)
- [x] Hindi version: title_hi/summary_hi/content_hi via AI translation, language toggle, Hindi search (1,084+ of 1,523 stories translated; backfill button in /admin)
- [x] Visible Admin button: desktop nav (bordered) + mobile bottom-bar tab
- [x] Secure first-admin bootstrap: server-side owner-email allowlist (secret), single-admin unique index, public reads of collection_logs/collector_state removed (public pages use privileged server reads)
- [x] Privacy-minimizing daily visitor tracking + admin totals (24h/7d) and 7-day trend
- [x] Verified 2026-11-02: collector ran 30x in the last hour (2-min schedule healthy), 1,523 articles from 14 sources, homepage/live/admin render without errors in browser check
- [x] Admin UI hidden from the public: nav link, mobile tab and big "Admin dashboard" button render only for signed-in admins (/admin still enforces auth + admin role server-side)
- [x] Live chat on /live: anyone can post an opinion (name + message, 500-char cap, 15s cooldown), realtime updates for all viewers, admin can delete messages; public history is limited to the last 7 days
- [x] Footer refresh time fixed on /search and /categories

## Open
- [ ] Owner signs up at /auth with the allowlisted email and clicks "Set up first admin" — blocked: no auth account exists yet (zero auth users); nothing for the agent to create without the user's sign-up
- [ ] Verify admin dashboard end-to-end (visitor/read analytics, story editing, chat moderation) signed in as the owner — blocked by the above
- [ ] Publish latest changes (admin gating, live chat, footer fix)
- [x] Deliver full source code export ZIP to Files, excluding secrets and dependencies

- [ ] Connect GitHub sync and push the latest app code — waiting for the project Git connection flow
