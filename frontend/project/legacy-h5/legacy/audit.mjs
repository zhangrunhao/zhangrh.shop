import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredPaths = [
  "index.html",
  "vite.config.ts",
  "legacy/shims/hilo.js",
  "legacy/shims/jquery.js",
  "legacy/shims/scroller.js",
  "legacy/shims/wx.js",
  "legacy/utils/legacy-utils.js",
  "legacy/utils/no-op-services.js",
  "script/hilo/1.4.2/hilo-min.js",
  "script/hilo/1.6.0/hilo-min.js",
  "script/jquery/3.4.1/jquery.min.js",
  "script/zepto/1.2.0/zepto.min.js",
  "script/scroller/1.2.2/Animate.js",
  "script/scroller/1.2.2/Scroller.js",
  "legacy/styles/reset.css",
  "1904_tale/index.html",
  "1905_word/index.html",
  "1907_cp/index.html",
  "1908_parade/index.html",
];

const forbiddenPatterns = [
  { pattern: /\{\{htmlWebpackPlugin/g, label: "html-webpack-plugin template variable" },
  { pattern: /\{\{!--/g, label: "handlebars comment" },
  { pattern: /assetCDNPath|scriptCDNPath/g, label: "legacy CDN template variable" },
  { pattern: /api\.k\.sohu\.com/g, label: "old Sohu API host" },
  { pattern: /\/api\/spell\//g, label: "old spell API" },
  { pattern: /getWeiXin|weiXinRegister|WeiXinJsSign/g, label: "WeChat backend flow" },
  { pattern: /open\.weixin\.qq\.com/g, label: "WeChat OAuth redirect" },
  { pattern: /res2\.wx\.qq\.com\/open\/js\/jweixin/g, label: "remote WeChat JS SDK" },
  { pattern: /sugar\.k\.sohu\.com/g, label: "old sugar host" },
  { pattern: /k\.sohu\.com\/static\/sugar-workshop\/19/g, label: "old project CDN path" },
  { pattern: /config\/Env\.json/g, label: "missing legacy Env config" },
  { pattern: /components\/(common|util)\//g, label: "old shared component import" },
];

const scanExtensions = new Set([".html", ".js", ".css", ".less", ".ts"]);

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(projectRoot, fullPath);
    if (entry.isDirectory()) {
      if (rel.startsWith("script")) return [];
      return walk(fullPath);
    }
    return scanExtensions.has(path.extname(entry.name)) ? [fullPath] : [];
  });
};

let failed = false;

for (const rel of requiredPaths) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`Missing required path: ${rel}`);
    failed = true;
  }
}

for (const filePath of walk(projectRoot)) {
  const rel = path.relative(projectRoot, filePath);
  const text = fs.readFileSync(filePath, "utf8");
  for (const item of forbiddenPatterns) {
    if (item.pattern.test(text)) {
      console.error(`Forbidden ${item.label} in ${rel}`);
      failed = true;
    }
    item.pattern.lastIndex = 0;
  }
}

if (failed) {
  process.exit(1);
}

console.log("legacy-h5 audit passed");
