import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

// https://vitejs.dev/config/
export default defineConfig({
  // This must match "homepage" in package.json to work with GitHub pages
  base: "/planet-sim",
  plugins: [
    glsl({
      include: [
        // Glob pattern, or array of glob patterns to import
        "**/*.glsl",
        "**/*.wgsl",
        "**/*.vert",
        "**/*.frag",
      ],
    }),
    react({ include: ["**/*.glsl", "**/*.wgsl", "**/*.tsx", "**/*.ts"] }),
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
  optimizeDeps: {
    exclude: ["three"], // One way to allow access to the WebGPU class
    /*esbuildOptions: {
      target: "esnext",
    },*/
  },
});
