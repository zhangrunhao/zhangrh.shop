import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, type ConfigEnv, type UserConfig } from "vite";
import { createProjectConfig } from "../../vite.config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const baseProjectConfig = createProjectConfig({ projectRoot }) as (
  env: ConfigEnv,
) => UserConfig;

const resolveProject = (...segments: string[]) => path.resolve(projectRoot, ...segments);

const legacyStaticDirs = [
  "script",
  "1904_tale/asset",
  "1905_word/asset",
  "1907_cp/asset",
  "1908_parade/asset",
];

const copyLegacyStaticAssets = () => {
  let outDir = "";

  return {
    name: "legacy-h5-copy-static-assets",
    apply: "build" as const,
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async writeBundle() {
      await Promise.all(
        legacyStaticDirs.map(async (dir) => {
          const source = resolveProject(dir);
          if (!fs.existsSync(source)) return;
          const target = path.join(outDir, dir);
          await fsp.rm(target, { recursive: true, force: true });
          await fsp.mkdir(path.dirname(target), { recursive: true });
          await fsp.cp(source, target, { recursive: true });
        }),
      );
    },
  };
};

export default defineConfig((env) =>
  mergeConfig(baseProjectConfig(env), {
    plugins: [copyLegacyStaticAssets()],
    resolve: {
      alias: {
        hilo: resolveProject("legacy/shims/hilo.js"),
        $: resolveProject("legacy/shims/jquery.js"),
        Scroller: resolveProject("legacy/shims/scroller.js"),
        wx: resolveProject("legacy/shims/wx.js"),
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: resolveProject("index.html"),
          "1904_tale/index": resolveProject("1904_tale/index.html"),
          "1905_word/index": resolveProject("1905_word/index.html"),
          "1907_cp/index": resolveProject("1907_cp/index.html"),
          "1908_parade/index": resolveProject("1908_parade/index.html"),
        },
      },
    },
  }),
);
