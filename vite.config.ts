import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      injectRegister: null,
      registerType: 'autoUpdate',
      manifest: {
        id: 'com.ahramkitchen.app',
        name: 'Ahram Kitchen',
        short_name: 'Ahram Kitchen',
        description: 'Order delicious Korean food from Ahram Kitchen',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        dir: 'ltr',
        lang: 'en',
        categories: ['food', 'shopping', 'lifestyle'],
        iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
        prefer_related_applications: true,
        related_applications: [
          {
            platform: 'play',
            url: 'https://play.google.com/store/apps/details?id=com.ahramkitchen.app',
            id: 'com.ahramkitchen.app'
          }
        ],
        scope: '/',
        start_url: '/',
        launch_handler: {
          client_mode: ['navigate-existing', 'auto']
        },
        screenshots: [
          {
            src: '/screenshots/home.png',
            sizes: '1280x720',
            type: 'image/png',
            platform: 'wide',
            label: 'Home Screen'
          }
        ],
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon'
          }
        ],
        scope_extensions: [
          {
            origin: 'https://ahramkitchen.com'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => true,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigationPreload: true,
        backgroundSync: {
          name: 'syncQueue',
          options: {
            maxRetentionTime: 24 * 60
          }
        },
        periodicSync: {
          name: 'content-sync',
          options: {
            minInterval: 24 * 60 * 60
          }
        }
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));