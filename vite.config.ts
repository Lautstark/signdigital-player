import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

/* A project site is served from /<repo>/, so the workflow passes that base. */
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [svelte()],
  server: { host: "127.0.0.1", port: 3010, strictPort: true },
});
