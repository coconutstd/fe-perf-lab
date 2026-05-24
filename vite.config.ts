import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    // npm run build 후 dist/stats.html 자동 생성
    visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true }),
  ],
})
