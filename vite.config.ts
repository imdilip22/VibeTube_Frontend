import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      "@vidstack/react", 
      "@vidstack/react/player/layouts/default",
      "maverick.js",
      "maverick.js/react"
    ],
  },
  server: {
    port: 5173,
  },
});