import { vitestConfig } from "@lautstark/toolchain/vitest";

/* The part worth testing has no DOM in it: what is asked of SIGNdigital, and
   what happens when the token has run out. */
export default vitestConfig({ include: ["test/**/*.test.ts"] });
