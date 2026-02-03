// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8'
    }
  }
})
