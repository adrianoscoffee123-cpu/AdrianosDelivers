# Project workflow

Owner instruction recorded November 1, 2026. This supersedes earlier roadmap instructions that defaulted to feature branches and repeated preview deployments.

- Default GitHub branch for future implementation updates: **main**.
- Default Vercel deployment target for tested application updates: **production**, project `adrianos1/adrianosdelivers`.
- Create another branch only when crucial to the change; explain the concrete reason. Do not create a branch automatically for each task/day.
- Prefer local verification. The owner requested removal of all existing Vercel previews and retention of production. There is no standing preview environment. The committed Vercel Git configuration enables automatic deployment only from `main`. Create a future preview only when explicitly requested or crucial to a specific change, with its reason explained.
- Run the checks appropriate to the change before pushing and deploying. Record the production URL and commit in the progress tracker.
- Production deployment and opening real ordering are distinct actions. Keep ordering closed until business rules, sign-in, order/staff/rider flows and launch checks are complete.
- The existing setup work is being integrated into `main` for the production-only transition. Preserve remote changes. The old `setup/menu-preview` branch is historical and should receive no further pushes; do not delete the Git branch automatically. Only non-production Vercel deployments are targeted for the requested cleanup.
- Documentation/status-only edits can be collected locally and included with the next implementation update; they do not require a new app deployment.

Current next milestone: **D1 — Google sign-in and approved operating rules**. The owner’s free-budget requirement and production-hosting eligibility still apply.
