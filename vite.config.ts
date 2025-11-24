import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This ensures process.env.API_KEY works if injected by some Node environments,
    // though import.meta.env.VITE_API_KEY is preferred in Vite.
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});