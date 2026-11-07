import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // IMG.LY 1.7.0 uses Zod 3 APIs such as z.function().args().
      // Keep those APIs while installing a patched Zod 4.x package.
      { find: /^zod$/, replacement: 'zod/v3' },
    ],
  },
})
