/* Draws the PNG icons from public/icon.svg. iOS takes no SVG for the home
   screen, and Android wants 192 and 512. Run after changing the SVG:
   `npm run icons`, then commit the PNGs. */
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";

const svg = await readFile(new URL("../public/icon.svg", import.meta.url), "utf8");
const browser = await chromium.launch();
for (const size of [180, 192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: new URL(`../public/icon-${size}.png`, import.meta.url).pathname });
  await page.close();
}
await browser.close();
