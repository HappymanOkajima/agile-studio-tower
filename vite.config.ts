import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/agile-studio-tower/' : '/',
  build: {
    assetsInlineLimit: 0,
    minify: false,
  },
  server: {
    proxy: {
      // Google Cloud Storage画像のプロキシ
      '/gcs-proxy': {
        target: 'https://storage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gcs-proxy/, ''),
      },
    },
  },
}))
