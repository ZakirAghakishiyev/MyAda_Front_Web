import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GATEWAY_TARGET = process.env.VITE_DEV_GATEWAY_TARGET || 'https://myada.site'

const proxyToGateway = (extra = {}) => ({
  target: GATEWAY_TARGET,
  changeOrigin: true,
  secure: false,
  ...extra,
})

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    open: true,
    // Match `/club/...` only, not `/clubs/...` so the SPA route stays local.
    proxy: {
      '/api': proxyToGateway(),
      '/attendance': proxyToGateway(),
      '/location': proxyToGateway(),
      '/lostfound': proxyToGateway(),
      '/call': proxyToGateway({ ws: true }),
      '^/club(?=/|$)': proxyToGateway(),
      '/support': proxyToGateway({ ws: true }),
    },
  },
})
