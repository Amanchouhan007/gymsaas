import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      exclude: /node_modules/
    }),
    VitePWA({
      disable: false,
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        suppressWarnings: true
      },
      manifest: {
        name: 'YOUR GYM - Gym Management Software',
        short_name: 'YOUR GYM',
        description: 'Multi-tenant Gym Management SaaS Application',
        start_url: '/login',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#120602',
        theme_color: '#ea580c',
        icons: [
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['index.html', 'assets/**/*.{js,css}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/, /^\/socket\.io/, /\.[a-zA-Z0-9]+$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              return (
                url.pathname.startsWith('/api') ||
                url.pathname.startsWith('/uploads') ||
                url.pathname.startsWith('/socket.io')
              );
            },
            handler: 'NetworkOnly'
          },
          {
            urlPattern: ({ url }) => url.origin !== self.location.origin,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 5000
  }
})

