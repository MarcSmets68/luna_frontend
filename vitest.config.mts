import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.mts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
});
