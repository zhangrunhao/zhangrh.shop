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

const previewBasePath = "/legacy-h5/";

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

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

const previewLegacyBasePath = () => {
  let outDir = "";

  return {
    name: "legacy-h5-preview-base-path",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }

        const pathname = new URL(req.url, "http://localhost").pathname;
        if (pathname === previewBasePath.slice(0, -1)) {
          res.statusCode = 302;
          res.setHeader("Location", previewBasePath);
          res.end();
          return;
        }
        if (!pathname.startsWith(previewBasePath)) {
          next();
          return;
        }

        const relativePath = decodeURIComponent(pathname.slice(previewBasePath.length));
        const targetPath = path.resolve(outDir, relativePath);
        if (targetPath !== outDir && !targetPath.startsWith(`${outDir}${path.sep}`)) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        let filePath = targetPath;
        let stat = await fsp.stat(filePath).catch(() => null);
        if (stat?.isDirectory()) {
          filePath = path.join(filePath, "index.html");
          stat = await fsp.stat(filePath).catch(() => null);
        } else if (!stat && !path.extname(filePath)) {
          filePath = path.join(filePath, "index.html");
          stat = await fsp.stat(filePath).catch(() => null);
        }

        if (!stat?.isFile()) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }

        res.statusCode = 200;
        res.setHeader(
          "Content-Type",
          mimeTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
        );
        res.end(await fsp.readFile(filePath));
      });
    },
  };
};

export default defineConfig((env) =>
  mergeConfig(baseProjectConfig(env), {
    appType: "mpa",
    plugins: [copyLegacyStaticAssets(), previewLegacyBasePath()],
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
