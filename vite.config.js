import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // In development the API is reached through the Vite server, so the
      // browser only ever talks to one origin (no CORS setup needed).
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  }
})
