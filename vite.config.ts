import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5172
  },
  define: {
    "process.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL)
  }
})
