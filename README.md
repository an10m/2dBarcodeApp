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
