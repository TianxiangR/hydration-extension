import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],

  build: {
    outDir: 'dist',
    emptyOutDir: false,

    rollupOptions: {
      input: {
        background: 'src/background/index.ts',
      },

      output: {
        // flatten everything into one file per entry
        inlineDynamicImports: false,
        manualChunks: undefined,
        preserveModules: false,

        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },

    minify: false, // avoid SW wrapper issues
  },
});
