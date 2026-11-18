# SignalCode

A Vite, React, and TypeScript PWA for barcode operations and public code verification.

## Development

```powershell
npm install
npm run dev
```

Open the local URL shown by Vite.

## Build

```powershell
npm run build
npm run preview
```

## Deploy to Cloudflare Workers

Authenticate Wrangler once, then deploy one application explicitly:

```powershell
npx wrangler login
npm run deploy:producer
npm run deploy:consumer
```

`npm run deploy` is an alias for `npm run deploy:all`. Each application is built as static assets and Wrangler serves those assets with SPA fallback for client routes.

## PWA and camera access

The production build registers a service worker and caches the app shell for offline use. Camera scanning uses the browser `BarcodeDetector` API and requires HTTPS or localhost. Browsers without `BarcodeDetector` can use manual verification.

## Producer and consumer applications

This repository builds two separate applications:

- The producer/distributor dashboard uses `index.html`, `src/App.tsx`, `dist/`, and `wrangler.jsonc`.
- The public consumer verification PWA uses `index.consumer.html`, `src/consumer/`, `dist-consumer/`, and `wrangler.consumer.jsonc`.

Run the applications locally:

```powershell
npm run dev
npm run dev:consumer
```

Build both applications:

```powershell
npm run build:all
```

Preview the consumer application:

```powershell
npm run preview:consumer
```

## Shared product passport UI

Both applications render batch histories with the same component, `src/components/ProductPassport.tsx`, styled by `src/components/passport.css`. The layout is the sticky product summary on the left and an alternating stage timeline on the right, where each stage is either `ok` (green check) or `warning` (amber, deviation resolved). Design tokens live in `src/theme.css` and are imported before each app's own stylesheet.

- Producer: open a row in the barcode library, or link directly with `/?barcode=BX-12480`.
- Consumer: verify a code (`/verify/demo`) to open the passport for that product.

Stage fixtures used by both apps live in `src/data/histories.ts`. Each stage needs `date`, `title`, `detail`, `location`, `country`, `state`, `tag`, and `kind`.

## Deploy to Cloudflare

### Local CLI deployment

Install dependencies and authenticate Wrangler:

```powershell
npm install
npx wrangler login
npx wrangler whoami
```

Deploy the producer dashboard:

```powershell
npm run deploy:producer
```

Deploy the public consumer website:

```powershell
npm run deploy:consumer
```

Deploy both workers:

```powershell
npm run deploy:all
```

The Worker project names are `2dbarcodeapp` for the producer dashboard and `2dbarcodeapp-consumer` for the public consumer site. The scripts always pass an explicit Wrangler config:

| Script | Build output | Wrangler config |
| --- | --- | --- |
| `deploy:producer` | `dist/` | `wrangler.jsonc` |
| `deploy:consumer` | `dist-consumer/` | `wrangler.consumer.jsonc` |

### Workers Builds (GitHub integration)

Both Workers are connected to this repository, so each Worker needs its own build and deploy commands. Use these settings in **Worker → Settings → Build**:

| Setting | `2dbarcodeapp` | `2dbarcodeapp-consumer` |
| --- | --- | --- |
| Root directory | `/` | `/` |
| Build command | `npm run build:producer` | `npm run build:consumer` |
| Deploy command | `npm run ci:deploy:producer` | `npm run ci:deploy:consumer` |

Do not use the default `npx wrangler deploy` command. Wrangler only auto-discovers `wrangler.toml`, `wrangler.json`, and `wrangler.jsonc`, so it always chooses `wrangler.jsonc` here and builds the producer app, even from the consumer Worker's build. The `ci:deploy:*` scripts always pass the correct `--config` flag.

If preview builds are enabled, use the matching preview scripts:

| Setting | `2dbarcodeapp` | `2dbarcodeapp-consumer` |
| --- | --- | --- |
| Preview command | `npm run ci:preview:producer` | `npm run ci:preview:consumer` |

The consumer build compiles `index.consumer.html`, renames the output to `dist-consumer/index.html` for Workers Static Assets, and runs `scripts/verify-consumer-build.mjs`. The build fails before deployment if the root HTML file or service worker precache entry is wrong.

After deployment, add the custom domain only to the `2dbarcodeapp-consumer` Worker. If that hostname previously served the producer app, unregister the old producer service worker and clear site data in the browser, then purge the Cloudflare cache. Use the consumer HTTPS origin in every generated GS1 Digital Link or QR/DataMatrix payload.

Consumer routes and examples:

- `/scan`
- `/verify/:payload`
- `/01/:gtin/10/:batch/21/:serial`
- `/?payload=...`

The consumer route remains public and read-only. Producer authentication, catalog storage, EPCIS events, and real verification records belong in a separate authenticated backend or worker rather than in the public bundle.

## Pharmacy portal (third application) and database

Pharmacists sign in to their own cabinet, scan or pick a batch and press **Qabul qildim** (received) or report a **deviation**. This writes to a Cloudflare D1 database, and the consumer and producer apps read the real status from it, so nobody has to change anything by hand after a phone call.

- Portal UI: `index.pharmacy.html`, `src/pharmacy/`, `dist-pharmacy/`, `wrangler.pharmacy.jsonc`.
- API + database: `worker/` (Cloudflare Worker, routes under `/api/*`), schema in `db/schema.sql`, demo batches in `db/seed.sql`.
- Before a pharmacy confirms receipt, the passport shows **"Dorixonaga yetkazilmoqda"**; the demo "pharmacy" stage from `histories.ts` is ignored for batches that exist in the database.

### One-time setup

```bash
npm install
npx wrangler login
npx wrangler d1 create signalcode          # copy database_id into wrangler.pharmacy.jsonc
npm run db:init:remote                      # creates tables and demo batches
npx wrangler secret put SESSION_SECRET --config wrangler.pharmacy.jsonc   # paste a long random string
node scripts/create-pharmacy-user.mjs apteka1 'ChangeMe-12345' "Dorixona №1" "Samarqand" > user.sql
npx wrangler d1 execute signalcode --remote --config wrangler.pharmacy.jsonc --file user.sql
npm run deploy:pharmacy
```

Then set `VITE_API_URL=https://<pharmacy-worker-url>` (see `.env.example`) wherever the **consumer** and **producer** apps are built, and redeploy them. Without it they keep showing the demo data.

To restrict a batch to one pharmacy, set `batches.assigned_user_id` to that user's id; otherwise any signed-in pharmacy may receive it.

### AI summary (Gemini free tier)

The product page shows a short AI summary at the top. It is generated by the pharmacy Worker (`worker/summary.ts`) through the Gemini API and cached for 6 hours so free-tier limits are not wasted.

Put the key **only on the pharmacy Worker** (never in `VITE_*` variables, because those end up in the public bundle):

- Dashboard: **Workers & Pages → `2dbarcodeapp-pharmacy` → Settings → Variables and Secrets → Add → type Secret → name `GEMINI_API_KEY` → paste the key**.
- CLI: `npx wrangler secret put GEMINI_API_KEY --config wrangler.pharmacy.jsonc`

Optional variable `GEMINI_MODEL` (plain text variable, not a secret) overrides the default `gemini-2.5-flash`. Secrets take effect immediately, no rebuild needed. Without the key the API returns a deterministic demo summary and the UI stays fully usable.

### Stage documents, comments and market data

- Every stage card in the passport is clickable. The modal shows the stage facts, resolved deviations, the responsible person and all documents. Each document opens an electronic preview with its fields and signature (`src/data/stageDetails.ts`).
- The timeline is ordered newest first.
- Comments, rating distribution, themes, monthly volume and category comparisons are deterministic demo aggregates in `src/data/insights.ts`.
- Oson Apteka / Arzon Apteka prices, availability and similar medicines are demo aggregates in `src/data/market.ts`; no partner API is connected yet. The UI labels them as demo data.
- The consumer app has a product search (by name, manufacturer, GTIN or batch) that opens the same full passport.

### Local development

```bash
npm run db:init:local
node scripts/create-pharmacy-user.mjs apteka1 'ChangeMe-12345' "Dorixona №1" "Samarqand" > user.sql
npx wrangler d1 execute signalcode --local --config wrangler.pharmacy.jsonc --file user.sql
echo 'SESSION_SECRET=dev-secret-change-me-dev-secret' > .dev.vars
npm run dev:api        # API on :8787
npm run dev:pharmacy   # UI with /api proxied to :8787
npm run test:worker    # API tests (node:sqlite in place of D1)
```

Adding a new batch for pharmacies to receive: insert a row into `batches` (gtin, batch, serial, name, manufacturer, payload) with `wrangler d1 execute`.
