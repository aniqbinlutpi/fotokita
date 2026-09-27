import path from "node:path"
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import type { Plugin } from 'vite'

function imageProxyPlugin(): Plugin {
  return {
    name: 'image-proxy-middleware',
    configureServer(server) {
      server.middlewares.use('/api/proxy-image', async (req, res) => {
        try {
          const reqUrl = req.url ? new URL(req.url, 'http://localhost') : null
          const targetUrl = reqUrl?.searchParams.get('url')

          if (!targetUrl) {
            res.statusCode = 400
            res.end('Missing "url" query parameter')
            return
          }

          const response = await fetch(targetUrl)
          if (!response.ok) {
            res.statusCode = response.status
            res.end(`Upstream failed with status ${response.status}`)
            return
          }

          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
          res.setHeader(
            'Content-Type',
            response.headers.get('content-type') || 'image/jpeg'
          )

          const arrayBuffer = await response.arrayBuffer()
          res.end(Buffer.from(arrayBuffer))
        } catch (err: any) {
          res.statusCode = 500
          res.end(err?.message || 'Failed to proxy image')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), imageProxyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api/media": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/media/, "/media"),
      },
      "/api/weddings": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/weddings/, "/weddings"),
      },
    },
  },
})

