import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Vite keeps the input HTML filename in the build output. The consumer app is
// entered through index.consumer.html, but Cloudflare Workers Static Assets
// expects the site root and SPA fallback at index.html.
function consumerEntryAsIndex(): Plugin {
  return {
    name: "consumer-entry-as-index",
    enforce: "post",
    generateBundle(_options, bundle) {
      const html = bundle["index.consumer.html"];
      if (!html || html.type !== "asset") return;
      delete bundle["index.consumer.html"];
      html.fileName = "index.html";
      bundle["index.html"] = html;
    }
  };
}

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    consumerEntryAsIndex(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "SignalCode mahsulotni tekshirish",
        short_name: "SignalCode",
        description: "Mahsulot 2D shtrix kodini skanerlash va tekshirish.",
        lang: "uz",
        theme_color: "#19382a",
        background_color: "#f5f7f2",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,woff2}"]
      }
    })
  ],
  build: {
    outDir: "dist-consumer",
    emptyOutDir: true,
    rollupOptions: {
      input: "index.consumer.html"
    }
  }
});
