import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,      // กำหนด Port (ปกติ Vite จะรันที่ 5173)
    open: true       // ให้เปิด Browser อัตโนมัติเมื่อรัน
  }
})