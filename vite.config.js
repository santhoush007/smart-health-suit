import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['fsevents']
  },
  build: {
    rollupOptions: {
      external: ['fsevents']
    }
  },
  base: '/An-Intelligent-Smart-Health-Suit-Using-Embedded-Biosensors-for-Real-Time-Vital-Analysis/',
})