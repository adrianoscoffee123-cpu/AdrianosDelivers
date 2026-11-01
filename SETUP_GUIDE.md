# Setup guide — free starting accounts

This guide was drafted during planning. The owner has since connected the plugins and supplied the menu and shop pin. A partial frontend now exists; consult [PARTIAL_SETUP.md](PARTIAL_SETUP.md) for the exact current linkage and apply order. Keep ordering closed during implementation. Do not change the existing Ssupertea system.

## 1. Create a dedicated Supabase project

1. Open [Supabase](https://supabase.com/) and sign in.
2. Create a new project in a Free organization, named `adrianos-delivery`. Choose a nearby available region and a strong database password stored in your password manager.
3. Find the project's **Connect / API Keys** details. Record the project URL and the **publishable** key. If using a legacy key, choose the `anon` key, never `service_role`.
4. The future Vite frontend will use only these public values, illustrated in `.env.example`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The database password is not needed in browser code. A publishable key is safe to expose only when database authorization is correctly configured.
5. The draft `supabase/migrations/001_delivery.sql` is for a new project only. Review it before running once in SQL Editor. It creates a closed store and no menu items.
6. Optional: `supabase/sample-menu.sql` inserts inactive sample items. Wait for the real menu to avoid unnecessary demo data. Do not activate samples as if they were the official menu.
7. Keep `accepting_orders=false` until the frontend and account tests pass. Set actual coordinates, fees and coverage through a future admin screen or trusted SQL editor.

Check [current Free limits](https://supabase.com/pricing) in the dashboard. Avoid upgrading or entering paid services automatically. Project inactivity, exceeded quotas, and unavailable services can interrupt a pilot.

## 2. Set up Google customer sign-in

Google sign-in avoids depending on SMS or bulk email delivery for customer registration. It does not need a Google Maps billing account.

1. In [Google Cloud Console](https://console.cloud.google.com/), create a dedicated project.
2. In Google Auth Platform / APIs & Services, configure the consent screen/branding, support email, audience, and minimal scopes (`openid`, `email`, `profile`). Console labels may differ.
3. Create an OAuth client of type **Web application**.
4. In Supabase **Authentication → Sign In / Providers → Google**, copy the displayed callback URL. It normally looks like `https://PROJECT_REF.supabase.co/auth/v1/callback`.
5. Add that exact callback as a Google **Authorized redirect URI**. Configure JavaScript origins as required by the selected Google flow; do not put a page path in an origin.
6. Enter the Google client ID and client secret in the **Supabase Google provider settings**. The client secret stays there; do not send it in chat or put it in the frontend.
7. Use the testing audience/test users for the pilot. Complete Google's production publishing/verification requirements if requested before allowing general customers.
8. Once the frontend has a URL, set Supabase **Authentication → URL Configuration → Site URL** to that address. Add exact allowed local/test/production redirect URLs as needed. Avoid broad production wildcards. Update these settings when adding a domain later.

Follow [Supabase's official Google guide](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) for the current console screens.

Public email signup is not part of the initial plan. Supabase's built-in mail sender has restrictions and is not a general production email service; email/password registration, magic links, or password resets for arbitrary addresses would need an appropriate SMTP arrangement. See [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp).

## 3. Authorize admin and rider accounts

Have each pilot user sign in once after the frontend is connected, then obtain their exact UUID from Supabase **Authentication → Users**. The trusted project owner runs the following in SQL Editor, replacing the example UUID and name:

```sql
insert into public.staff_users(user_id,display_name,role)
values ('REPLACE_WITH_AUTH_USER_UUID', 'Owner name', 'admin');
```

For a rider, use role `rider`. Do not create staff roles by changing user profile metadata, and do not grant all registered users staff access. The draft has mutually exclusive admin and rider roles; if the owner also delivers, design explicit dual capabilities before adding that feature.

## 4. Maps and GPS — no paid API key needed initially

- Leaflet displays a map with a draggable destination pin. Customers enter their address manually; no autocomplete/geocoding API is necessary.
- For a low-volume pilot, standard OSM tiles need visible OpenStreetMap attribution, an appropriate referer policy, normal browser caching, and no offline tile scraping. See the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/). This is a best-effort third-party service, not unlimited production hosting.
- Browser geolocation needs HTTPS, permission, and a GPS-capable phone. Localhost can be used for development. The rider should keep the page open and the phone awake during the pilot. Do not promise background tracking from a PWA.
- Use an [external Google Maps directions URL](https://developers.google.com/maps/documentation/urls/guide) for navigation. This needs no Google Maps API key.
- Fixed-fee radius checks run in Supabase. An OpenRouteService, Google Maps, Mapbox, SMS, payment, or Grab/Foodpanda API key is not needed for this initial scope.

## 5. GitHub and Vercel — target after frontend implementation

1. Create/sign in to [GitHub](https://github.com/) and [Vercel](https://vercel.com/). Enable MFA for both owner accounts. Keep the repository private if desired.
2. When the frontend is ready, push a reviewed project to GitHub with `.env`, secrets, and private customer data excluded.
3. After confirming the destination project, import/link the repository in Vercel. The implemented frontend is a Vite static app; its build command is `npm run build` and output directory `dist`, declared in `vercel.json`.
4. Configure only the public Supabase variables above in the intended Vercel environments, then build. A new deployment is needed after changing build-time `VITE_*` values.
5. Use the assigned `*.vercel.app` URL initially. Add exact Supabase redirect URLs and complete Google OAuth setup for the actual deployment address.
6. Later, add the purchased domain in Vercel, configure its DNS as instructed, and update Supabase's Site URL/redirect allowlist and any applicable Google origins. Keep a rollback address available during the transition.

**Hosting policy:** Vercel Hobby is restricted to personal/non-commercial use. Do not take real Adriano’s business orders under Hobby without an eligible arrangement. A custom domain does not remove this restriction. Since Vercel is the requested target, leave commercial launch pending rather than silently selecting a paid plan. [Official policy](https://vercel.com/docs/limits/fair-use-guidelines).

## What can be shared with the implementation chat

- Menu, logo, store map share link, hours, public contact details, delivery rules.
- Supabase project URL; the publishable key is public by design, though direct project/environment configuration is preferred.
- Public deployment URL and intended admin/rider emails or UUIDs when needed for authorization.

Keep database passwords, service-role/secret keys, OAuth client secrets, access tokens, and account passwords out of chat and source control. Enter them only into the appropriate provider dashboard if a step requires them.
