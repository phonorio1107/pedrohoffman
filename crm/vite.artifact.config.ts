import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

// Versão para publicar como página única (claude.ai): npm run build:pagina
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  define: { 'import.meta.env.VITE_ARTIFACT': JSON.stringify('1') },
  build: { outDir: 'dist-pagina', assetsInlineLimit: 100_000_000, cssCodeSplit: false },
});
