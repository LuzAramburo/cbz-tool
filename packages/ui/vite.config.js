import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': `http://localhost:${process.env['PORT'] ?? '3000'}`, // forward API calls to Express
    },
  },
  build: {
    outDir: '../server/public', // builds into server's public folder
    emptyOutDir: true,
  },
});
