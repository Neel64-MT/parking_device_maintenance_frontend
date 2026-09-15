import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Production lives at /frontend/ because the server root already hosts CoreDocAssist.
  base: command === 'build' ? '/~gsrtc/parking_device_maintenance/frontend/dist/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['lana-nonconceptual-unplunderously.ngrok-free.dev'],
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
