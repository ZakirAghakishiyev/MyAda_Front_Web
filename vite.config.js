import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GATEWAY_TARGET = process.env.VITE_DEV_GATEWAY_TARGET || 'http://13.60.31.141:5000'
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    open: true,
    // Match `/club/...` only, not `/clubs/...` (Vite’s string prefix would wrongly proxy the SPA).
    proxy: {
      '/call': { target: GATEWAY_TARGET, changeOrigin: true, ws: true },
      '^/club(?=/|$)': { target: GATEWAY_TARGET, changeOrigin: true },
      '/support': { target: GATEWAY_TARGET, changeOrigin: true, ws: true },
    },
  },
})
