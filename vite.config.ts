
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows Vercel/Netlify environment variables to be injected into the client bundle
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: './index.html',
    },
  },
});
