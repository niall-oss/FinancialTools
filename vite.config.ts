import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function serveConfigPlugin() {
  return {
    name: "serve-config",
    configureServer(server: { middlewares: { use: (fn: (req: unknown, res: { setHeader: (k: string, v: string) => void; end: (b: string) => void }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        const url = (req as { url?: string }).url;
        if (url === "/config/defaults.txt") {
          const configPath = path.join(rootDir, "config", "defaults.txt");
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(fs.readFileSync(configPath, "utf-8"));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: "src",
  plugins: [react(), tailwindcss(), serveConfigPlugin(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
