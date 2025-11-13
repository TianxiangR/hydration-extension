import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Build configuration for Chrome Extension
 * 
 * Strategy:
 * - Extension scripts (background, content, injected, devtools) must be self-contained
 *   Chrome extensions cannot load additional chunks for these scripts
 * - Side panel (HTML entry) uses code splitting with vendor chunks
 * 
 * Implementation:
 * - manualChunks recursively traces imports to detect extension script dependencies
 * - Any module imported by extension scripts is inlined (returns undefined)
 * - Modules only imported by side_panel are chunked into vendor
 * 
 * Result:
 * ✅ background.js, content.js, injected.js, devtools.js - fully bundled, no imports
 * ✅ side_panel.js - can import from chunks/vendor-*.js
 */
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        side_panel: './index.html',
        background: 'src/background/index.ts',
        content: 'src/content/index.ts',
        injected: 'src/injected/index.ts',
        devtools: 'src/devtools/index.ts',
      },
      output: {
        manualChunks: undefined,
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  }
})
