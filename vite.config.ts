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
        name: "私密生活筆記",
        short_name: "生活筆記",
        description: "加密的日記、筆記與隨手記",
        theme_color: "#1a1625",
        background_color: "#0f0d14",
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
      },
    }),
  ],
});
