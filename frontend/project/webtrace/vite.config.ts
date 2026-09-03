import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { createProjectConfig } from "../../vite.config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const staticRouteHtml = (): Plugin => {
  let outputDirectory = "";

  return {
    name: "webtrace-static-route-html",
    apply: "build",
    configResolved(config) {
      outputDirectory = config.build.outDir;
    },
    closeBundle() {
      const source = path.join(outputDirectory, "index.html");
      if (!fs.existsSync(source)) {
        throw new Error(`Missing WebTrace build entry: ${source}`);
      }

      for (const route of ["support", "privacy"]) {
        const destination = path.join(outputDirectory, route, "index.html");
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(source, destination);
      }
    },
  };
};

export default createProjectConfig({
  projectRoot,
  plugins: [staticRouteHtml()],
});
