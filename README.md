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

Authenticate Wrangler once, then deploy:

```powershell
npx wrangler login
npm run deploy
```

The app is built as static assets in `dist/`. Wrangler serves the assets directly and uses SPA fallback for client routes.

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

The worker names are `signalcode-producer` and `signalcode-verify`. After deployment, add a custom domain to the consumer Worker in the Cloudflare dashboard. Use that public HTTPS origin in every generated GS1 Digital Link or QR/DataMatrix payload.

Consumer routes and examples:

- `/scan`
- `/verify/:payload`
- `/01/:gtin/10/:batch/21/:serial`
- `/?payload=...`

The consumer route remains public and read-only. Producer authentication, catalog storage, EPCIS events, and real verification records belong in a separate authenticated backend or worker rather than in the public bundle.
