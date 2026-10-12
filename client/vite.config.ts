import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'favicon.png',
        'apple-touch-icon.png',
        'brand/apple-touch-icon.png',
        'brand/favicon.ico',
        'brand/favicon.svg',
        'brand/favicon.png',
        'brand/finflow-logo.svg',
        'brand/finflow-logo.png',
        'brand/finflow-mark.svg',
        'brand/finflow-mark.png',
        'offline.html',
        'push-sw.js',
      ],
      manifest: {
        name: 'FinFlow — Private Finance Management',
        short_name: 'FinFlow',
        description: 'Private Finance Management',
        theme_color: '#072661',
        background_color: '#FAF7F2',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/brand/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/brand/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/brand/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/brand/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/brand/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        shortcuts: [
          {
            name: 'Executive Dashboard',
            short_name: 'Dashboard',
            description: 'FinFlow Key Financial Metrics & Summaries',
            url: '/',
            icons: [{ src: '/brand/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Finance Deals',
            short_name: 'Deals',
            description: 'Active Loans & Deal Syndications',
            url: '/deals',
            icons: [{ src: '/brand/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Repayments & Collections',
            short_name: 'Repayments',
            description: 'Record Collections & Waterfall Splits',
            url: '/repayments',
            icons: [{ src: '/brand/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Financial Reports',
            short_name: 'Reports',
            description: 'Audit Ledgers, Investor Statements, & Statements',
            url: '/reports',
            icons: [{ src: '/brand/pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        importScripts: ['/push-sw.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          // SECURITY RULE: Strictly never cache private financial API responses
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
