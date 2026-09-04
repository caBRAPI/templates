import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
  plugins: [
    viteSingleFile()
  ],

  build: {
    outDir: "build",
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    sourcemap: false,
  },
  esbuild: {
    drop: ["console", "debugger"],
    legalComments: "none",
  },
})