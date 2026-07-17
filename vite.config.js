import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // This forces Vite to be more robust during the build process
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  }
})