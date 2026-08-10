import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Relative assets keep the same build working locally and on GitHub Pages.
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5185,
    strictPort: true,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 5185,
    strictPort: true,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
