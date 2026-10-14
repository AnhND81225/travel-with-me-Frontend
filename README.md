<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9732e617-bb30-4407-99d3-8238508e97a6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Storefront reference implementation

The customer Home page follows the supplied TerraPeak Stitch reference. Original public image URLs are centralized in `src/data/storefront.ts`; the small logo is a local SVG substitute because the original logo URL does not load publicly.

Run locally with `bun install` and `bun run dev` (or the npm equivalents). The storefront preview does not need a Gemini API key. Validate with `bun run lint` and `bun run build`.

Pricing, availability, capacity, and departures are mock fixtures. Legacy mock price units are rendered as VND through the fixed `DEMO_VND_PER_UNIT` constant in `src/utils/formatters.ts`; this is demo pricing, not a live exchange-rate service. The reference products and tours are registered in the existing catalog, so product detail, Buy/Rent, and cart flows use the same data. Newsletter preferences are preview-only; no email is sent. Branch map images are static reference artwork with links to Google Maps directions.

## Customer orders and tours

- `/orders` is the customer order hub, separate from `/passport`. It renders rental records from the custody store and tour reservations from the booking store, with type filters, search, details, and downloadable plain-text demo summaries.
- `/tours` provides activity, region, difficulty, month, and budget filters, a featured itinerary, equipment links, and a shared reservation dialog. `/expeditions/:id` uses the same reservation dialog.
- Tour reservations are in-memory demo data: they appear in My Orders during client-side navigation and reset on a full page reload. They are not real bookings or payments. The booking store checks group size against remaining demo capacity.

### Stitch fidelity pass — account and tours

`OrdersReference` and `ToursReference` are local JSX transcriptions of the supplied Stitch project screens, including their original photos, 2024 sample account, itinerary, SVG elevation profile, typography, spacing, and palette. They contain no original inline scripts, synthetic social-proof notifications, or remotely executed design code. `stitch-reference.css` maps the reference tokens to Tailwind 4 and scopes legacy icon/radius/shadow differences to these screens. The shared header retains working branch/search/cart controls and a local replacement for the unavailable original logo.

The account history, credit, weather, and original dates are clearly labeled design fixtures. Rental extensions and issue forms are session previews. Live demo tour reservations remain listed separately in My Orders and use the app’s 2026 sample catalog. QR issuance, historic records, bundle reservation, and private inquiry delivery need backend services; dialogs explain their current availability. Printing uses the browser print dialog.
