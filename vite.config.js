import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GATEWAY_TARGET = process.env.VITE_DEV_GATEWAY_TARGET || 'http://13.60.31.141:5000'
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/call': { target: GATEWAY_TARGET, changeOrigin: true, ws: true },
      '/support': { target: GATEWAY_TARGET, changeOrigin: true, ws: true },
    },
  },
})
