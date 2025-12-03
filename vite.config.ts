import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    target: ['es2015', 'safari11'],
    minify: 'esbuild', // Cambiar a esbuild (más rápido y no requiere dependencia extra)
  }
});
