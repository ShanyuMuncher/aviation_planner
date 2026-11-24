import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/weather': {
        target: 'https://aviationweather.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/weather/, ''),
        headers: {
          'User-Agent': 'aviation-planner/0.1 (local learning project)',
        },
        proxyTimeout: 15000,
      },
    },
  },
})
