import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for PDFMentor
// Sets up React plugin and proxy for backend API calls
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy API requests to Flask backend to avoid CORS issues during development
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
