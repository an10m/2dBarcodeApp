import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Same trick as the consumer app: the entry is index.pharmacy.html, but Workers
// Static Assets expects index.html at the site root.
function pharmacyEntryAsIndex(): Plugin {
  return {
    name: "pharmacy-entry-as-index",
    enforce: "post",
    generateBundle(_options, bundle) {
      const html = bundle["index.pharmacy.html"];
      if (!html || html.type !== "asset") return;
      delete bundle["index.pharmacy.html"];
      html.fileName = "index.html";
      bundle["index.html"] = html;
    }
  };
}

export default defineConfig({
  base: "/",
  plugins: [react(), pharmacyEntryAsIndex()],
  server: {
    // `npm run dev:api` (wrangler dev) listens on 8787.
    proxy: { "/api": "http://localhost:8787" }
  },
  build: {
    outDir: "dist-pharmacy",
    emptyOutDir: true,
    rollupOptions: { input: "index.pharmacy.html" }
  }
});
