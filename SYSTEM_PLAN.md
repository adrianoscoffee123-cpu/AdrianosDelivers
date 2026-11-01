# Adriano’s delivery system plan

Prepared November 1, 2026. Vercel remains the requested hosting target; a custom domain can be added later. The user will supply the menu and shop location. Pricing and coverage below are proposals to review, not published business rules.

**Progress update:** the owner has now supplied nine menu images and the pin `10.423282164368267, 122.91901469110203`. The real menu storefront and catalog database update are implemented locally. See [PARTIAL_SETUP.md](PARTIAL_SETUP.md) for the current status; the build sequence and pending-input list below describe the original plan and should be read with that update. Delivery rules remain unapproved.

## What we will build

A mobile-friendly website for one Adriano’s branch, with a familiar food delivery flow inspired by Grab/Foodpanda and the supplied Ssupertea reference:

| Customer | Store admin | Rider |
| --- | --- | --- |
| Browse categories and item details | Open or close ordering | See assigned active deliveries |
| Choose quantity and add to cart | Edit menu, price, availability | View pickup and delivery details |
| Sign in with Google | Confirm or cancel orders | Open external navigation |
| Choose pickup or delivery | Mark orders preparing and ready | Start delivery |
| Enter address and map pin | Assign an authorized rider | Explicitly start or stop sharing GPS |
| Review the confirmed cash total | Track order status and latest GPS | Complete handover and cash collection |
| See status and latest rider location | Complete pickup orders | Lose access to customer details when delivery closes |
| Cancel while still pending | View recent order history | Get a clear warning if GPS is unavailable |

This is Adriano’s own ordering and dispatch system. Adriano’s supplies the riders; it does not summon a Grab or Foodpanda rider. A multi-restaurant marketplace, automatic dispatch, delivery partners, and native Android/iOS apps are outside the first version.

## Suggested starting delivery rules

1. One branch and a small initial service area. After receiving the actual pin, review nearby roads and barriers before choosing coverage. A possible starting proposal is a **3 km straight-line radius** with a **PHP 35 flat delivery fee**; both require owner approval.
2. Cash on delivery and cash on pickup. No online payment gateway or automatic GCash verification in version one.
3. No minimum order at first, unless the owner chooses one after reviewing costs. Delivery charges are shown before confirmation. Pickup has no delivery fee.
4. Customers place one active order at a time. The store accepts orders manually and can reject an inaccessible destination before preparation. No hidden fee adjustment after checkout; any change requires agreement and a new confirmed order.
5. Store staff manually open or close ordering. Publish actual operating hours once supplied. Out-of-stock items cannot be ordered.
6. Admin assigns an available rider. Rider starts delivery after the food is ready, then completes it after handover and cash collection. The owner needs a process for failed deliveries and cash reconciliation.
7. Customers can cancel pending orders themselves. After acceptance, contact the store. Staff can cancel with the customer informed; detailed cancellation reasons and notifications will be designed during implementation.
8. The store publishes a preparation estimate only if it can support one. The first version shows order progress and GPS freshness, with no invented road-distance ETA.

The radius is geographic coverage, **not driving distance**. It does not model bridges, rivers, traffic, or roads. Admin should review the address before accepting. If accurate road-based charges are required later, add a separately evaluated routing service with server-side credentials and quotas.

The database draft currently contains provisional defaults of a 5 km radius and PHP 35 fee, with ordering closed. Replace them with approved values before opening; they are not a decided business policy.

## Order lifecycle

Delivery: `Pending → Preparing → Ready for rider → On the way → Completed`.

Pickup: `Pending → Preparing → Ready for pickup → Completed`.

The underlying database value `ready` is shared by both flows; the interface will label it according to fulfillment type. Only an assigned authorized rider can start or complete a delivery. Only authorized store staff complete pickups. Cancelled and completed orders cannot be reopened by normal users.

## Free services and limits

| Component | Choice | Cost / constraint |
| --- | --- | --- |
| Database, user accounts, updates | Supabase Free | Quota-limited; currently 500 MB database, 1 GB storage, 50,000 monthly active users, 5 GB egress; free projects may pause after a week of inactivity. |
| Website host | Vercel, as requested | Hobby is for personal non-commercial use. A live Adriano’s ordering business requires an eligible commercial plan or a different eligible host. |
| Initial address | Provider subdomain | A custom domain is optional and has a separate purchase/renewal cost later. |
| Customer login | Google OAuth through Supabase | Avoids requiring SMS or production email delivery for normal customer login. Requires Google OAuth setup. |
| Interactive map | Leaflet | Open-source library; no Leaflet API key. |
| Basemap | OpenStreetMap standard tiles for low-volume pilot | No key; attribution, caching, referer and usage policy apply. Best-effort service with no SLA. Reassess for scale. |
| GPS | Browser geolocation over HTTPS | No API key; rider must allow access and have mobile data. Background and locked-screen tracking is unreliable in a web app. |
| Fee calculation | Supabase SQL | Fixed fee inside approved radius. No routing or geocoding API needed. |
| Payment | Cash | No gateway transaction API. Adriano’s must manage cash collection itself. |
| Rider navigation | External Google Maps directions link | No embedded Google Maps API key or Maps Platform billing required for the link. |
| Updates and notifications | In-app status and Supabase Realtime | Quota-limited. First version promises updates while the site is open; SMS, WhatsApp, and reliable background push are separate work. |

**A fully free live commercial system on Vercel Hobby is not a supported plan.** Buying a domain does not change that. We can build and test locally without hosting fees, and use Hobby only for a use that meets its personal/non-commercial policy. Resolve commercial hosting before a real customer launch. Free infrastructure never removes rider wages, fuel, mobile data, packaging, or business operating costs.

Sources checked during planning:

- [Vercel Hobby policy](https://vercel.com/docs/plans/hobby)
- [Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines)
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase Realtime limits](https://supabase.com/docs/guides/realtime/limits) — currently 200 concurrent connections on Free; check message quotas in the project dashboard too.
- [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
- [Google Maps URL directions](https://developers.google.com/maps/documentation/urls/guide)

## Information needed from the owner

| Needed | What to send / decide | When |
| --- | --- | --- |
| Actual menu | Name, category, price, size/variant, available add-ons and their prices, description, availability, photos if owned | Before real menu implementation |
| Brand | Logo if available, preferred colors, exact display name | Before final visual design |
| Shop location | Google Maps share link or latitude/longitude, full pickup address, branch name | Before coverage setup |
| Contact | Public store phone number; email/contact for order and privacy questions | Before public pilot |
| Hours | Days and times, cutoff, holidays, temporary closures | Before opening orders |
| Delivery policy | Approved radius or barangays, fee, minimum order, excluded areas, cancellation and failed-delivery handling | Before opening delivery |
| Riders | Whether using own riders, number of riders, display names and login emails | Before delivery testing |
| Store staff | Owner/admin login email and other authorized staff | Before admin testing |
| Accounts | Dedicated Supabase project, Google OAuth project, GitHub repository, Vercel project | During setup |
| Workload | Approximate daily orders and busiest simultaneous users | Before quota planning |
| Payments | Confirm cash only initially; decide cash handover/reconciliation process | Before pilot |
| Data handling | Who handles data requests, proposed order retention period, delivery incident process | Before public launch |
| Hosting | Confirm an eligible commercial arrangement for live business use | Before real orders |

Send the menu as convenient; it need not be perfectly formatted. Do not send passwords, database passwords, service-role keys, OAuth client secrets, or Vercel tokens in chat.

## Security design

- Supabase validates sessions; database permissions enforce access even if someone bypasses the UI. Browser route guards are only a convenience.
- Staff roles live in a separate allowlist, never in customer-editable profile metadata. Only the trusted project owner manages grants initially.
- All order totals come from database menu prices. The client cannot set prices, total, payment status, assignment, or order status directly.
- Checkout uses an idempotency token and one-active-order constraint. A draft limit of 20 submissions per customer per day reduces repeated order spam; this is not complete bot or DDoS protection.
- GPS writes are restricted to the assigned rider during an active dispatch, at most once per 15 seconds. Store only the latest fix, not a full route history. Completion/cancellation removes the live position. The interface must hide stale location, remove cached private map state on sign-out, and offer stop-sharing controls.
- Only the owning customer, authorized admin, and assigned active rider may access the relevant order. Rider access ends when the order closes. Order events store status, not GPS history.
- The frontend uses only the publishable Supabase key. Service-role and secret keys never go in frontend code, `VITE_*`, commits, screenshots, or chat.
- Planned frontend controls: HTTPS, restrictive security headers, safe text rendering, input validation, no private order data in a service-worker cache, and session cleanup on sign-out.
- Protect owner accounts with MFA. Keep Supabase Auth abuse protections/rate limits enabled. Evaluate CAPTCHA integration if public password signup is introduced. Google sign-in does not verify the supplied delivery phone number.
- Define order retention and backups before public use; free hosting/database tiers do not provide a full production continuity plan. No compliance certification or security guarantee is claimed by this draft.

## Build sequence

1. **Plan and inputs:** review this proposal, receive menu and shop details. Current phase.
2. **Frontend:** responsive Adriano’s storefront, cart, map pin selection, clear demo labeling, admin and rider screens. Confirm menu variants/add-ons before finalizing schema and trusted pricing logic.
3. **Accounts and backend:** dedicated Supabase setup, Google sign-in, schema, explicit staff grants, closed-store connection tests.
4. **Workflow:** trusted checkout, staff transitions and rider assignment, active-delivery GPS and freshness handling, Realtime with reconnection/refresh fallback.
5. **Pilot:** two customer accounts, an admin and at least two rider accounts; test privacy isolation, incorrect totals, wrong roles, double clicks, lost connection, outside coverage, cancellations, and locked-screen GPS behavior. Test production security headers and OAuth redirects.
6. **Launch:** approve actual menu, fees and coverage; resolve commercial hosting eligibility; publish support/privacy details; open ordering only after a successful phone-based pickup and delivery pilot.

The draft schema supports one price per menu item. If the supplied menu contains sizes or paid add-ons, extend the catalog and server-side quote validation before building checkout; do not trust frontend-only modifier pricing.
