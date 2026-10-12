# Implementation validation — 11 October 2026

`npm test`: **23 checks passed**, no failures. This includes the real schema and retention function in embedded PostgreSQL with local Supabase Auth/Storage substitutes. `npm run build`: passed. Final bundle: JavaScript 283.43 kB (78.34 kB gzip), CSS 40.01 kB (9.06 kB gzip), plus separately served assets.

Browser verification covered:

- All three actual GLB models rendered in the requested desktop arrangement, with SHAH behind them. At 390 × 844, only the centre model received a source; widening the viewport loaded the other two.
- No horizontal document overflow at mobile width. Navigation opened/closed, combined PTA/storage filters returned the expected match, and phone details and owner editor fit their dialog widths.
- Draft remained hidden; publication added it to current stock; sold status moved it to the sold view; archive/restore worked. Custom 13-day checking persisted. Comparison rejected a fourth phone.
- Product enquiries contained exact listing details and its link; sold listings had no enquiry button. No WhatsApp message was sent.
- Request submission appeared in the local private inbox with escaped notes. No request was sent to a live shop inbox.
- Actual photo upload produced WebP. A 5.055-second QA video was encoded to a 10% smaller MP4, saved as cover and loaded in the product gallery with controls, 960 × 540 dimensions and a 5.23-second playable duration. The original source was retained outside the app.
- Private inspection check and custom checking period survived save/reopen. Public details excluded private cost/serial/IMEI. Sign-out cleared the editor's private DOM contents.
- JSON backup export and restore worked. The collection was restored to its baseline six current / three sold / zero draft / zero request state after testing.
- Production `dist` served under `/iphones_by_shah/`: all models and six stock images loaded, direct product fragment survived reload, and WhatsApp retained the repository folder in its link. No browser console errors or warnings were reported.

The live Supabase project, Google OAuth flow, real Storage uploads and Cron job were not configured or tested. They need the project configuration and owner account described in `supabase/README.md`. No commit, push or deployment was made. Browser media encoding was checked in the in-app Chromium browser; other browsers use the documented original-file fallback when encoding is unavailable.

Screenshots: `verification/showroom-desktop.jpg` and `verification/showroom-mobile.jpg`. The ignored verification folder also holds test-only artifacts; it is not in the production bundle.


## Requested page and 3D refinements — 12 October 2026

`npm test`: **31 checks passed**, including the previous backend checks and eight new navigation/cache regressions. `npm run build`: passed with all seven HTML entries. Final JavaScript: 287.32 kB (80.25 kB gzip); CSS: 48.49 kB (10.68 kB gzip). `node scripts/optimize_models.mjs --check`: passed for all three derivatives, with unchanged texture bytes, triangle counts and animation keyframes and byte-identical decoding with the bundled viewer decoder. Total GLB payload dropped 44.01%, from 17,672,204 to 9,895,500 bytes. Original models are intact.

Browser verification covered the larger navigation, compact headline and higher phones; removal of the top preview banner; separate current stock, sold stock, product, request, contact and owner documents; product refresh and sold-product enquiry suppression; comparison selection across documents; and mobile menu/gallery layouts.

The Duo's actual `open-close` animation was verified at folded (t=1.999), open (t=0) and intermediate positions. Native scrolling changed progress to 0.603 and visibly bent the hinge. Manual playback advanced progress and completed the unfolding. Explicit view selections survived focus scrolling; a subsequent native wheel scroll resumed scrubbing (progress 0.718). Off-screen hero rotation stopped; the motion control removed/reinstated auto-rotation. Mobile loads only the optimized centre model until the viewport widens. The default viewer progress bars are hidden in favour of the SHAH splash and a dedicated Duo progress line.

Observed loading times vary with rendering work: one desktop repeat in development took about 3.05 seconds and a mobile centre-only load about 1.82 seconds. In the production-folder preview, a full desktop scene took about 5.99 seconds and a repeat about 6.60 seconds. Both production loads finished with all three real models and no fallback. Compression and caching reduce transfer work; they do not eliminate GPU/renderer initialization. The splash has an 8.5-second fallback timer so a failed asset cannot permanently cover the storefront; a blocked main thread can delay any JavaScript timer.

All seven production documents and the model/renderer/decoder/service-worker endpoints returned HTTP 200 under `/iphones_by_shah/`. A direct product URL survived refresh, and the WhatsApp enquiry retained the repository folder and exact product ID. The production owner preview opened with the baseline six available and three sold phones. No live messages, stock edits, request submissions or deployments were made in this refinement pass. No browser console errors or warnings were reported.

Responsive checks at 390 × 844, 760 × 900 and 1920 × 900, plus the default desktop viewport, showed no horizontal overflow. The asset cache tests exercised repeat fetches, exclusion of inventory/configuration/HTML/private routes, partial-request bypass, unavailable/full cache fallback and cleanup limited to old showroom caches.

Screenshots for this revision: `verification/revision-home.jpg`, `verification/revision-mobile.jpg` and `verification/revision-duo.jpg`.
