import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/* TypeScript inside components, and nothing else: one static page, no router. */
export default { preprocess: vitePreprocess() };
