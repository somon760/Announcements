import { cpSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const root = process.cwd();
const htmlEntries = Object.fromEntries(
  readdirSync(root)
    .filter(file => file.endsWith(".html"))
    .map(file => [file.replace(/\.html$/, ""), resolve(root, file)])
);

function copyStaticSiteFiles() {
  return {
    name: "copy-static-site-files",
    closeBundle() {
      const outputDir = resolve(root, "dist");

      for (const file of readdirSync(root)) {
        if (file.endsWith(".js") || file.endsWith(".json") || file === "styles.css") {
          cpSync(resolve(root, file), resolve(outputDir, file));
        }
      }

      cpSync(resolve(root, "images"), resolve(outputDir, "images"), { recursive: true });
      cpSync(resolve(root, "server"), resolve(outputDir, "server"), { recursive: true });
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [copyStaticSiteFiles()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: htmlEntries
    }
  }
});
