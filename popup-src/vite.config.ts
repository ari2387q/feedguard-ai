import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite configuration for the FeedGuard AI popup.
 * Outputs the compiled bundle into ../extension/popup/ so the
 * Chrome extension can reference it via popup/index.html.
 */
export default defineConfig({
  plugins: [react()],
  base: './',

  build: {
    /** Output directly into the extension's popup directory */
    outDir: resolve(__dirname, '../extension/popup'),
    emptyOutDir: true,

    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },

  /** Chrome extensions don't support HMR — use a standard dev server port */
  server: {
    port: 5173,
  },
});
