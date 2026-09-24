import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'money-saathi-lockup.png',
        'money-saathi-emblem.png',
        'money-saathi-app-icon.png',
        'money-saathi-maskable-icon.png',
      ],
      manifest: {
        lang: 'en-BT',
        name: 'Money Saathi',
        short_name: 'Money Saathi',
        description:
          'Bhutan-first personal finance tracker for understanding, planning and tracking money.',
        theme_color: '#175a43',
        background_color: '#f7f2e8',
        display: 'standalone',
        start_url: '/app',
        scope: '/',
        icons: [
          {
            src: '/money-saathi-app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/money-saathi-maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
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


