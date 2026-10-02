import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { execSync } from "node:child_process";

/* A project site is served from /<repo>/, so the workflow passes that base. */
const base = process.env.BASE_PATH ?? "/";

/* Which build is running, shown under Einstellungen: when it was built and
   from which commit. CI names the commit in GITHUB_SHA; a local build asks git. */
function commit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "lokal";
  }
}

export default defineConfig({
  base,
  plugins: [svelte()],
  server: { host: "127.0.0.1", port: 3010, strictPort: true },
  define: {
    __BUILD__: JSON.stringify({ time: new Date().toISOString(), commit: commit() }),
  },
});
