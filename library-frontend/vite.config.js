import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // ✅ FIX: Proper React Fast Refresh configuration
      fastRefresh: true,
      // Babel config for React 19 compatibility
      babel: {
        parserOpts: {
          sourceType: 'module',
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true,
        },
      },
    }),
    tailwindcss(),
  ],

  // ✅ FIX: Proper server and HMR configuration
  server: {
    // Host configuration
    host: '0.0.0.0',
    port: 5173,
    
    // ✅ FIX: HMR configuration to avoid WebSocket issues
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
    },
    
    // Middleware order
    middlewareMode: false,
    
    // Watch options
    watch: {
      usePolling: false,
    },
  },

  // Build options
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
  },

  // Resolve options
  resolve: {
    alias: {
      '@': '/src',
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@react-oauth/google',
      'framer-motion',
      'jwt-decode',
      'axios',
    ],
  },
})
