import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/mdm-api': {
        target: 'https://mdmsaatlik.toroslaredas.com.tr',
        changeOrigin: true,
        secure: false,
        rewrite: (p: string) => p.replace(/^\/mdm-api/, '/toroslar/mdmapi')
      },
      '/mdm-api-energy': {
        target: 'https://mdmsaatlik.toroslaredas.com.tr',
        changeOrigin: true,
        secure: false,
        rewrite: (p: string) => p.replace(/^\/mdm-api-energy/, '/toroslar/mdm-api/customer')
      }
    }
  }
})