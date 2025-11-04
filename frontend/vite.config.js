import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      "/api": {
        target: "http://backend:4000",
        changeOrigin: true,
      },
      "/phpmyadmin": {
        target: "http://backend:4000",
        changeOrigin: true,
      },
      // ajouter ces lignes :
      "/js": {
        target: "http://backend:4000",
        changeOrigin: true,
      },
      "/css": {
        target: "http://backend:4000",
        changeOrigin: true,
      },
      "/themes": {
        target: "http://backend:4000",
        changeOrigin: true,
      },
      "/img": {
        target: "http://backend:4000",
        changeOrigin: true,
      },
      "/assets": {
        target: "http://backend:4000",
        changeOrigin: true,
      },
    },
  },
});
