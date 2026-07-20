import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Skip the PWA plugin under Vitest so the service worker / `virtual:pwa-register`
    // machinery doesn't run in jsdom — the update prompt is unit-tested with a mock.
    ...(mode === "test"
      ? []
      : [
          VitePWA({
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            registerType: "prompt",
            includeAssets: ["favicon.png", "apple-touch-icon-180x180.png"],
            manifest: {
              id: "/",
              name: "BookTalk",
              short_name: "BookTalk",
              description: "Share what you're reading and talk books with friends.",
              theme_color: "#6d3ecc",
              background_color: "#ffffff",
              display: "standalone",
              start_url: "/",
              scope: "/",
              icons: [
                { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
                { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
                { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
                {
                  src: "maskable-icon-192x192.png",
                  sizes: "192x192",
                  type: "image/png",
                  purpose: "maskable",
                },
                {
                  src: "maskable-icon-512x512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "maskable",
                },
              ],
            },
            injectManifest: {
              globPatterns: ["**/*.{js,css,html,png,svg,woff,woff2}"],
            },
            devOptions: { enabled: false },
          }),
        ]),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@booktalk/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      // The PWA plugin (which supplies this virtual module) is disabled under Vitest,
      // so point the import at a stub the tests can override.
      ...(mode === "test"
        ? { "virtual:pwa-register/react": path.resolve(__dirname, "./src/test/stubs/pwa-register.ts") }
        : {}),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
}));
