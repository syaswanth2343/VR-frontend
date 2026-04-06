import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API calls so the frontend can be opened from a public URL.
    // - Frontend: makes requests to `/api/...`
    // - Vite dev server: forwards `/api` to the Spring Boot backend on port 5000
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
