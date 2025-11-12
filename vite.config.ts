import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
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
        entryFileNames: '[name].js',
      }
    },
    outDir: 'dist',
  }
})
