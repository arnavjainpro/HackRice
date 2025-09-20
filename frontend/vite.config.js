import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    proxy: {
      '/inventory': 'http://localhost:8000',
      '/api': 'http://localhost:8000'
    }
  }
})