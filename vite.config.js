import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      'smartparkdevicetrack.dev-project-server.com',
    ],
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
})
