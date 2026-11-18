import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "SignalCode mahsulotni tekshirish",
        short_name: "SignalCode",
        description: "Mahsulot 2D shtrix kodini skanerlash va tekshirish.",
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
