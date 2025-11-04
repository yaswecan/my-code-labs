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
      // page principale phpMyAdmin
      "/phpmyadmin": {
        target: "http://backend:4000",
        changeOrigin: true,
      },
      // phpMyAdmin parle beaucoup à /index.php
      "/index.php": {
        target: "http://backend:4000",
        changeOrigin: true,
      },
      // ressources statiques que phpMyAdmin charge à la racine
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
