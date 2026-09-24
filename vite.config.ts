import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const onemapToken = 
    process.env.ONEMAP_API_TOKEN || 
    process.env.VITE_ONEMAP_TOKEN || 
    process.env.VITE_ONEMAP_API_TOKEN || 
    process.env.ONEMAP_TOKEN || 
    '';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.ONEMAP_API_TOKEN': JSON.stringify(onemapToken),
      'process.env.VITE_ONEMAP_TOKEN': JSON.stringify(onemapToken),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
