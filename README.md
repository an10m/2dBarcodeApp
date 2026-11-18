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
