# AdrianosDelivers

Adriano’s delivery system — partial setup with ordering closed.

The owner-supplied menu contains **126 products and 170 priced size/flavor choices**. The storefront supports search, categories, item selection, a saved bag, original menu photos, and directions to the confirmed La Carlota store location.

See [PARTIAL_SETUP.md](PARTIAL_SETUP.md) for connection status and the database/deployment steps, and [MENU_REVIEW.md](MENU_REVIEW.md) for the complete menu transcription and items that need clarification.

The current work plan is [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md): seven workdays, November 2–8, 2026 (Asia/Manila), targeting final deployment on November 8 subject to release checks. Follow [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) for daily milestones and owner decisions. Edit status/evidence in [PROJECT_TRACKER.json](PROJECT_TRACKER.json), then run `node scripts/project-progress.mjs` to refresh the board and Gantt source.

```sh
npm ci
npm test
npm run build
```

The production build is in `dist/`. Optional connected mode uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Checkout remains disabled in this partial release. Supabase migrations and the official catalog seed must be reviewed against the intended dedicated project before applying. Do not use the old sample menu seed for the real catalog.

All 17 automated checks pass. The live Supabase catalog and protected Vercel preview are connected and browser-verified. The partial setup is pushed to GitHub on `setup/menu-preview`. Google OAuth, live checkout, admin/rider screens, GPS and phone testing remain pending. See PARTIAL_SETUP.md for the current preview URL and setup results.

