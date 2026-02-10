import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
export default defineConfig({
  plugins: [react(), basicSsl()],
  define: {
    global: 'window',
    'process.env': {},
  },
  server: {
    host: '0.0.0.0',   // 👈 allow access via IP
    port: 5174,        // you can change this if you want
    https: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },
  build: {
    sourcemap: true, // Enable sourcemaps for debugging
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'lucide';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'chartjs';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
