import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Resolve shared package source so Vite compiles it (ESM named exports work)
      "@booktalk/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
});
