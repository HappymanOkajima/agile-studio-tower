import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/agile-studio-tower/' : '/',
  build: {
    assetsInlineLimit: 0,
    minify: false,
  },
}))
