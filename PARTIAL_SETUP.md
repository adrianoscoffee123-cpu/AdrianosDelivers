# Partial setup — November 1, 2026

## Completed locally

- Store pin: **10.423282164368267, 122.91901469110203**.
- Address from the menu: Burgos Street, Brgy. 3 Poblacion, La Carlota City, in front of McDonald’s Drive Thru.
- The nine unchanged menu images are in `public/menus/`. `data/menu.js` contains the full transcription: **126 products, 170 priced choices, 22 categories**.
- Real drink sizes and prices are distinct, including iced espresso vs. cold brew; flavor and protein choices have separate stable catalog keys.
- Search, category filters, item details, size/flavor selection, quantity changes, a bag saved on this device, original-menu viewing, store directions, and privacy information are implemented.
- This is a partial release: the bag cannot submit orders, and no payment or location permission is requested. No customer address/phone data is collected.
- Supabase is optional at build time. Without a connection the supplied real menu is shown with a clear local-menu status. With a verified catalog connection, prices load from Supabase and Google sign-in becomes available. A failed connection shows an explicit fallback status; it never enables checkout.
- A new catalog migration adds unique purchasable variant keys. Sensitive SQL implementations move into an unexposed `private` schema behind restricted invoker RPCs. Trusted quote snapshots include category and size/flavor so identically named drinks remain distinguishable.
- Vercel configuration builds static `dist/` output and adds CSP, frame protection, content-type protection and a permissions policy. Precise geolocation is disabled in this release; enable it intentionally when rider tracking is implemented.
- Build-time checks reject privileged keys, unapproved browser environment variable names, and malformed Supabase project URLs. No private keys were requested or copied.

## Connection checks

The plugin manager reports Supabase, GitHub and Vercel **installed and enabled**. However, no provider-specific project/database/repository tools are exposed to this chat. Plugin installation does not establish authentication for a separately installed local CLI.

- Vercel CLI initially reported `loggedIn: false`, `linkedProject: null`. Project inspection attempted a device login; it was stopped without completing authentication or creating a project. Read-only integration discovery also attempted login in this environment, so no integration was installed.
- Supabase CLI has no access token/session. Project listing could not proceed. No cloud SQL was executed.
- GitHub was linked by the owner during setup: `https://github.com/adrianoscoffee123-cpu/AdrianosDelivers.git`, initial commit `30d17cf`. The local changes preserve the owner’s new README title and repository files. The partial setup is saved on local branch `setup/menu-preview` (implementation commit `4b79b39`). The push was attempted and rejected with HTTP 403: local Git authenticated as `Zek3zra`, which lacks write access to `adrianoscoffee123-cpu/AdrianosDelivers`. Sign local Git into the intended repository-owner account through the normal credential flow before retrying; no remote branch was created by this attempt.
- A migration was generated using the Supabase CLI. CLI migration-list verification attempted localhost PostgreSQL but no local Supabase/Docker database was running. Local SQL verification instead uses PGlite integration tests.
- Vercel project linking and environment verification are incomplete. The [Vercel bootstrap skill](<C:/Users/Jerow Amelo/.codex/plugins/cache/openai-curated-remote/vercel/0.54.1/skills/bootstrap/SKILL.md>) explicitly says: “Do not run `db:push`, `db:migrate`, `db:seed`, or `dev` until Vercel linking is complete and env keys are verified.” Consequently, the development/preview server has not been started. Static production builds and local database/DOM checks are independent of live credentials.

## What is needed to link safely

Identify the intended **Supabase project name/dashboard link**, **Vercel team/project name/dashboard link**, and **GitHub repository link**. Do not paste tokens, passwords, database passwords, OAuth client secrets, or service-role keys.

Then either expose the connected provider tools in the chat/session, or authenticate the local provider CLIs using their normal browser flows. The local CLI binaries are installed in the ignored `.tools/` directory. Complete authentication directly with the provider; credentials are not part of this repository.

Before any change, inspect the project name and existing schema. Do not reuse the Ssupertea database or the existing Adriano’s reporting/POS database without confirming a deliberate migration plan. If multiple possible projects are present, select the dedicated delivery project first. No paid resources or additional projects should be created by default.

## Supabase apply order, once the target is verified

For a **new, empty, dedicated project**, apply and verify in this order:

1. `supabase/migrations/001_delivery.sql` — baseline schema; run once only if those objects do not exist.
2. `supabase/migrations/20261101100144_adrianos_catalog_setup.sql` — catalog fields and RPC hardening; run once.
3. `supabase/migrations/20261101101316_trusted_variant_snapshots.sql` — records trusted size/flavor/category in quoted order items. Earlier committed migration contents are preserved.
4. `supabase/catalog-seed.sql` — repeatable owner-supplied catalog import and closed-store pin setup.
5. `supabase/verify-setup.sql` — read-only verification; expect 126 distinct products, 170 catalog rows, zero active rows and `accepting_orders=false`.
6. Run the provider's security advisors and resolve findings before connecting public clients. Keep the `private` schema out of the Data API exposed schemas.

If the project already has migration history or similarly named tables, inspect and reconcile it rather than re-running the baseline blindly. The previous initial draft uses a short migration filename; reconcile/import its version with the CLI only after inspecting remote migration history. Do not apply a remote migration through these notes without checking the intended project.

All actual menu choices are **published for browsing but inactive for ordering**. The seed does not overwrite previously approved availability when re-run, but explicitly closes the store as part of this partial setup. Review it before reusing it after launch.

Google provider setup, exact redirect allowlists, admin/rider role grants, and live account testing remain pending. The scaffold does not enable public email/password signup.

## Vercel build configuration

- Framework: Vite.
- Install: `npm ci`.
- Build: `npm run build`.
- Output directory: `dist`.
- Required public keys for connected mode: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- No keys: a real-menu browsing preview builds, with ordering disabled.
- Both keys: Supabase catalog and sign-in can connect after the database setup is verified.
- Only one key, a secret/service-role key, or an invalid URL: build fails rather than publishing an unsafe/broken connection.

Once linked, verify the selected owner/project before setting environment variables or deploying. Use a preview deployment for review. A custom domain is optional later. Vercel Hobby's non-commercial restriction still applies; resolve an eligible arrangement before real business orders.

## Run local checks

Use Node.js 22.12+ (or a compatible newer release):

```sh
npm ci
npm test
npm run build
npm run catalog:sql -- --check
```

`npm run catalog:sql` regenerates SQL after an edit to `data/menu.js`. `node scripts/menu-review.mjs` regenerates the readable transcript. The old `supabase/sample-menu.sql` is used only in baseline regression tests; do not run it when importing the real menu.

## Decisions still needed before live orders

- Delivery area, fee, minimum order and operating hours. Existing database radius/fee defaults remain provisional; they are not approved business rules.
- Packaging policy: the menu prints a PHP 10 take-out box. Confirm whether required per meal/order or optional; no automatic fee is added.
- Sauce options/serving, Thai Milk Tea/Hot Chocolate sizes, water/can volumes, and drink add-on compatibility/substitution rules. These are flagged in MENU_REVIEW.md; no sizes or ingredients were invented.
- Public contact number, admin and rider accounts, cash handover/failed-delivery process.
- Complete admin/rider screens, trusted checkout UI, active GPS/reconnection handling and phone-based end-to-end pilot.

The initial price catalog represents extras as separately priced items. Before live checkout, confirm and implement item-to-extra assignment and compatibility, particularly oat milk substitutions. The current browsing bag is not a finalized checkout data model.

## Verification scope

Automated checks cover the transcript’s identities/prices, persisted bag validation, size-specific totals, search and selection, original images, disabled checkout, server-side tampering rejection, RLS isolation, authorized transitions, duplicate checkout, GPS privacy, and secret-key build rejection.

These checks are local. They do not establish a live cloud connection or test browser layout, Google OAuth, Realtime, deployment security headers, or mobile background GPS. Those checks remain required after linkage.
