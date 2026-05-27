import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 400,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Vendor core (React + ReactDOM + Router)
          if (id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-router')) {
            return 'vendor-core'
          }
          // Helmet SEO (rara vez cambia)
          if (id.includes('react-helmet-async') ||
              id.includes('react-side-effect') ||
              id.includes('invariant') ||
              id.includes('shallowequal')) {
            return 'vendor-seo'
          }
          // React Query + Devtools
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query'
          }
          // Charts (recharts ocupa ~500KB)
          if (id.includes('recharts') ||
              id.includes('d3-')) {
            return 'vendor-charts'
          }
          // UI icons
          if (id.includes('lucide-react')) {
            return 'vendor-ui'
          }
          // Toast notifications
          if (id.includes('react-hot-toast') ||
              id.includes('goober')) {
            return 'vendor-toast'
          }
          // Zustand state management
          if (id.includes('zustand') ||
              id.includes('use-sync-external-store')) {
            return 'vendor-state'
          }
        },
      },
    },
  },
})
