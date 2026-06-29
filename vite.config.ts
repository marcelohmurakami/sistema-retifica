import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react()],
})

plugins: [
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Sistema Retífica',
      short_name: 'Retífica',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#0f172a',
      icons: [
        {
          src: '/images/logoPng192',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/images/logoPng512',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  })
]