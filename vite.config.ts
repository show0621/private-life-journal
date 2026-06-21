import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "The Hideaway",
        short_name: "Hideaway",
        description: "The Hideaway — your private journal",
        theme_color: "#ebe6dc",
        background_color: "#ebe6dc",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: base,
        scope: base,
        icons: [
          {
            src: `${base}icons/icon.svg`.replace("//", "/"),
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
});
