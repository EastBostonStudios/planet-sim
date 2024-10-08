import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  // This must match "homepage" in package.json to work with GitHub pages
  base: "/planet-sim",
  plugins: [
    react(),
    visualizer({
      emitFile: true,
      filename: "rollup-stats.html",
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
        },
      },
    },
  },
});
