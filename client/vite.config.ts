
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// If you see a warning about browserslist/caniuse-lite being outdated, run:
// npm run update-db (server) or npx update-browserslist-db@latest
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
