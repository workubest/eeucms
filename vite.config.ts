import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy Netlify function calls to GAS for development
      '/.netlify/functions/api': {
        target: 'https://script.google.com/macros/s/AKfycbwWoZtW-PbJv0wCB6VQquETpPpbenpFjRlhioqJ1jR0_5ES689-S_X126R9IVNoBDe0/exec',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          // Extract the API path after the function prefix
          const apiPath = path.replace('/.netlify/functions/api', '');
          console.log('🔄 Development proxy rewrite:', path, '→', apiPath);
          return apiPath;
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔧 Development proxy error:', err.message);
            console.log('🔧 Request details:', req.method, req.url);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Development proxy request:', req.method, req.url);
            // Ensure proper headers for GAS
            proxyReq.setHeader('Content-Type', 'application/json');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers for development
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-api-key, x-client-version';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            console.log('✅ Development proxy response:', proxyRes.statusCode);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'eeu-logo.png', 'eeu-logo-new.png'],
      manifest: {
        name: 'EEU Complaint Management System',
        short_name: 'EEU Complaints',
        description: 'Ethiopian Electric Utility Complaint Management System - Track and manage customer complaints efficiently',
        theme_color: '#ea580c',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/eeu-logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/eeu-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['business', 'productivity', 'utilities'],
        shortcuts: [
          {
            name: 'New Complaint',
            short_name: 'New',
            description: 'Create a new complaint',
            url: '/complaints/new',
            icons: [{ src: '/eeu-logo.png', sizes: '96x96' }]
          },
          {
            name: 'View Complaints',
            short_name: 'Complaints',
            description: 'View all complaints',
            url: '/complaints',
            icons: [{ src: '/eeu-logo.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
                return `${request.url}`;
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
                return `${request.url}`;
              }
            }
          },
          {
            urlPattern: ({ request }: { request: Request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: ({ request }: { request: Request }) => request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          // Cache Google Apps Script API calls
          {
            urlPattern: /^https:\/\/script\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gas-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes for GAS API
              },
              cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
                return `${request.url}`;
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
