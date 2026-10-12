# iPhones by Shah

A white studio storefront with burgundy accents, real 3D phones and an owner workspace. Built from the supplied answers and hero reference. The centre model is the iPhone 18 Pro Max, with the iPhone 16 Pro Max to its left and Duo to its right, over the oversized SHAH wordmark.

## Run locally

Requires Node.js 22.12+; validation used Node.js 24.

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:4173/. Use the **Owner login** link in the footer, then **Open local admin preview** to try the owner workflow. That option exists only on loopback addresses. Local stock, uploaded media and requests persist in this browser's IndexedDB. Demo access is not a Google login and resets on reload. An owner JSON backup can be exported and restored in local preview.

```powershell
npm test
npm run build
npm run preview
```

Stop the development server before starting the production preview: both use port 4173. Open through an HTTP server rather than directly opening `index.html`, because this is a Vite module application.

## Implemented

- Responsive 3D hero with a compact headline, larger navigation, floating phones, slow automatic rotation, entrance animation, drag controls and subtle pointer movement. Mobile initially loads only the centre model. Motion pauses off-screen and respects reduced-motion preferences.
- Scroll-driven Duo showcase uses the supplied opening/closing clip, with folded, halfway and open controls plus manual playback.
- iPhone 18 quality showcase reuses the optimized hero model for a full scroll-driven orbit, a closer camera view and three synchronized detail chapters. View buttons support manual selection; motion controls and reduced-motion preferences also apply here.
- Minimal loading splash reveals **iPhone → by (from the left) → SHAH**, with actual asset progress, a short minimum entrance duration and an 8.5-second fallback timer. Meshopt derivatives reduce the three model downloads from 17.67 MB to 9.90 MB (44%). Original textures, animation and geometry counts are preserved. A service worker caches only model/renderer assets for repeat visits; inventory, configuration, auth and requests remain uncached.
- Separate current-stock and sold-stock pages, four cards per row on laptop/desktop and two on mobile, instant search, model/storage/price/condition/PTA/availability filters, sorting, fresh-stock timestamps and comparison of up to three phones. The homepage previews four available phones.
- Individual product pages with galleries, image/video covers, condition half-scores out of 10, battery, PTA/JV, SIM, repairs, marks, included items and checking terms. WhatsApp enquiry includes the exact listing and phone details. Sold and reserved listings have no purchase-enquiry button.
- Separate request page with a form collecting only model, color, PTA preference and notes, with an acknowledgement and private owner inbox. No contact field or public request-status workflow.
- Owner workspace: add/edit, draft and preview before publication, available/reserved/sold states, archive/restore, featured picks, media ordering and cover selection, private purchase cost/margin, identifiers, inspection checks, notes, request archiving and activity history.
- Photos optimized to WebP at up to 1,800 pixels. Videos limited to 60 seconds and 25 MiB; supported browsers attempt smaller MP4 encoding at up to 1,280 pixels/24 fps and retain the smaller result. Unsupported or failed optimization retains the original and reports this. Videos play on demand.
- Separate visit/contact page with directions, opening hours and call links. Original logo, supplied photos, business/contact information, curated social links, directions, FAQ and provisional checking/privacy copy. Customer payment and delivery arrangements are confirmed with Shah on WhatsApp; there is no online payment processor.

## Connect the live store

Follow [supabase/README.md](supabase/README.md). Install `schema.sql` and `retention.sql`, configure Supabase Google OAuth, approve the owner's Auth UUID in the single-owner allowlist, configure the public project URL/key in `public/config.json`, and schedule the retention job. The publishable/anon key is public by design; service-role and Google secrets must remain server-side.

The SQL separates published device details from private records and validates owner writes in RPCs. Visitor requests are bounded and have a global hourly cap. The included PostgreSQL tests execute the real SQL/RLS with local Auth/Storage substitutes. They do not replace testing a deployed Supabase project, Google OAuth, real uploads or the scheduled cleanup job.

The requested top preview banner has been removed. With blank configuration, the nine supplied temporary images are paired with illustrative details: five current listings and four sold listings, including the Duo. An existing local preview moves the original sample Duo to sold once, preserving edited prices/media, other records and later owner availability changes. These are not verified real stock, prices or product specifications. No sample inventory is inserted into a connected live database, and a live connection failure never becomes a successful local save. On a hosted, unconfigured preview, owner editing is unavailable and request submissions explain that the inbox is not connected.

Request retention is 30 days for active requests and 45 days from archiving. Local preview prunes eligible requests when opened or accessed. The live store needs the separately documented Cron job to enforce cleanup. Backups have their own retention.

## GitHub Pages

The project remote is `bilalsaeed10b/iphones_by_shah`. `.github/workflows/pages.yml` runs tests/builds and publishes `dist` after pushes to `master` or `main`, or a manual workflow run. In the repository's Settings → Pages, select **GitHub Actions** as the source. This implementation has not been pushed or deployed.

Vite uses the relative base `./` and builds seven actual HTML documents: home (`index.html`), `stock.html`, `sold.html`, `request.html`, `contact.html`, `phone.html?id=UUID`, and `admin.html`. They support direct visits and refreshes under a GitHub Pages repository path, without server rewrite rules. Old fragment links redirect to the corresponding page. Permit the exact production and development `admin.html` callback URLs in Supabase. Update canonical/social metadata if the final domain differs from the repository's Pages URL. Individual phone links work in WhatsApp; social crawlers see the general storefront metadata because GitHub Pages does not server-render the per-phone query parameter.

## Files and preserved work

- `src/page-shell.html` — shared page source; `scripts/generate_pages.mjs` generates the seven HTML entry files before development/build. Run `npm run pages` after changing the shell during development.
- `src/main.js`, `src/style.css`, `src/pages.css` and `src/quality.css` — interface and design; `src/navigation.js` — page links and owner callback; `src/showroom.js` — loading, rotation and scroll animation.
- `src/domain.js` — catalogue rules; `src/store.js` — local/live storage; `src/backend.js` — Supabase client; `src/media.js` — browser media processing.
- `public/` — deployable models, local renderer/decoder, logo, photos, asset-cache service worker and public configuration. `scripts/optimize_models.mjs --check` verifies the optimized GLBs, including compatibility with the bundled decoder; `docs/model-optimization.json` records the results.
- `supabase/` — database schema, retention function and live setup guide.
- `docs/approved-answers.json`, `docs/approved-brief.md`, `docs/hero-reference.png` — preserved inputs.
- `planning.html`, `plan.css`, `plan.js`, `website-plan.html` — the original decision page and portable plan. `python scripts/package_plan.py` regenerates the portable plan from `planning.html`. These planning exports are not included in the production Vite bundle.
- `tests/` — catalogue, client contract and executable PostgreSQL authorization/retention tests.

## Launch inputs still needed

Owner Google account and Supabase connection, verified live device details/photos, complete checking/exchange coverage and delivery charges, and confirmation of usage rights for the supplied iPhone 18/Duo assets. Full refund terms were not supplied, so the site asks customers to confirm coverage with Shah instead of inventing a guarantee. Optional custom domain and launch date were left open.

The user's original logo, `phone3d models/` archives and images remain intact. The supplied iPhone 16 Pro Max model is by [MajdyModels](https://sketchfab.com/3d-models/iphone-16-pro-max-41a071ae12794b668502f58d1e0fd1a3), used under CC BY 4.0, with an in-page credit. Google model-viewer 4.1.0 is bundled under Apache 2.0. The iPhone 18/Duo archive metadata did not contain a usage license. Optional Google Fonts have system-font fallbacks.
