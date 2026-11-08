import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  ...(mode === "learner-regression" ? {
    build: {
      target: "node20",
      outDir: ".regression-build",
      emptyOutDir: true,
      lib: {
        entry: path.resolve(__dirname, "./tests/learnerEngine.regression.ts"),
        formats: ["es"],
        fileName: "learnerEngine.regression",
      },
    },
  } : {}),
}));
