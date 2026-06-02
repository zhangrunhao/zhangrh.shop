import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, type ConfigEnv, type UserConfig } from "vite";
import { createProjectConfig } from "../../vite.config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const baseProjectConfig = createProjectConfig({ projectRoot }) as (
  env: ConfigEnv,
) => UserConfig;

const resolveProject = (...segments: string[]) => path.resolve(projectRoot, ...segments);

export default defineConfig((env) =>
  mergeConfig(baseProjectConfig(env), {
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
