import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The client talks to the Socket.io server on :4000.
// In dev we proxy /socket.io so the browser can use a same-origin URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
