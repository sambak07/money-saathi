import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['money-saathi-icon.svg'],
      manifest: {
        name: 'Money Saathi',
        short_name: 'Money Saathi',
        description:
          'Bhutan-first personal finance tracker for understanding, planning and tracking money.',
        theme_color: '#176b4b',
        background_color: '#f7f5ef',
        display: 'standalone',
        start_url: '/app',
        scope: '/',
        icons: [
          {
            src: '/money-saathi-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})

