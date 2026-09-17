import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const PRODUCTION_ORIGIN = 'https://smartparkdevicetrack.dev-project-server.com/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? PRODUCTION_ORIGIN : '/',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['smartparkdevicetrack.dev-project-server.com'],
    proxy: {
      '/api': {
        target: 'http://209.182.213.242:5050',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://209.182.213.242:5050',
        changeOrigin: true,
      },
    },
  },
}))
