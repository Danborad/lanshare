import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        // 支持TailwindCSS的@指令
        charset: false,
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5007',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5007',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios', 'socket.io-client'],
        },
      },
    },
  },
})