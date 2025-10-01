import { defineConfig } from "vite";
import minifyHTML from '@lit-labs/rollup-plugin-minify-html-literals';

export default defineConfig({
  base: "",
  plugins: [
    minifyHTML(),
  ],
  build: {
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        entryFileNames: "mybabylonviewer.js",
        chunkFileNames: "[name]_[hash].js",
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('node_modules/@babylonjs')) {
              return 'babylon';
            } else if (id.includes('node_modules/@lit') || id.includes('node_modules/lit')) {
              return 'lit';
            } else {
              return 'vendor';
            }
          }
        }
      }
    }
  }
});