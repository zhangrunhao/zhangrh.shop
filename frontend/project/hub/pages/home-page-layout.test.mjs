import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(currentDir, "..");

const readHubFile = (relativePath) =>
  fs.readFileSync(path.join(hubRoot, relativePath), "utf8");

test("homepage owns contact links and footer stays minimal", () => {
  const homePage = readHubFile("pages/home-page.tsx");
  const footer = readHubFile("components/app-footer.tsx");

  assert.match(homePage, />关于我</);
  assert.doesNotMatch(homePage, /About \/ 联系方式/);
  assert.match(homePage, /HOME\.about\.email/);
  assert.match(homePage, /HOME\.about\.github/);
  assert.doesNotMatch(footer, /Email/);
  assert.doesNotMatch(footer, /GitHub/);
  assert.doesNotMatch(footer, /前端开发、AI 编程和独立产品实践记录/);
});

test("homepage contact actions are ordered by likely intent", () => {
  const homePage = readHubFile("pages/home-page.tsx");

  const emailIndex = homePage.indexOf("\n              Email\n");
  const githubIndex = homePage.indexOf("\n              GitHub\n");
  const aboutIndex = homePage.indexOf("\n              了解更多\n");

  assert.ok(emailIndex > -1);
  assert.ok(githubIndex > emailIndex);
  assert.ok(aboutIndex > githubIndex);
});

test("homepage hero title is sized for a short personal tagline", () => {
  const homePage = readHubFile("pages/home-page.tsx");

  assert.match(homePage, /前端开发者，用 AI 编程做真实作品。/);
  assert.doesNotMatch(homePage, /前端开发者，正在用 AI 编程做真实作品。/);
  assert.match(homePage, /max-w-\[900px\]/);
  assert.match(homePage, /text-\[32px\]/);
  assert.match(homePage, /font-medium/);
  assert.match(homePage, /md:text-\[44px\]/);
  assert.doesNotMatch(homePage, /max-w-\[680px\]/);
  assert.doesNotMatch(homePage, /text-\[36px\]/);
  assert.doesNotMatch(homePage, /md:text-\[56px\]/);
  assert.doesNotMatch(homePage, /text-\[42px\]/);
  assert.doesNotMatch(homePage, /md:text-\[64px\]/);
});

test("homepage section headings do not add explanatory helper copy", () => {
  const homePage = readHubFile("pages/home-page.tsx");

  assert.match(homePage, />作品</);
  assert.match(homePage, />文章</);
  assert.doesNotMatch(homePage, /先放三个代表作品/);
  assert.doesNotMatch(homePage, /近期值得先读的记录/);
});

test("homepage list sections link to the full list pages", () => {
  const homePage = readHubFile("pages/home-page.tsx");

  assert.match(homePage, /to="\/products"[\s\S]*?查看更多/);
  assert.match(homePage, /to="\/articles"[\s\S]*?查看更多/);
  assert.doesNotMatch(homePage, /to="\/ideas"/);
});

test("homepage work cards are fully clickable and use green background hover", () => {
  const homePage = readHubFile("pages/home-page.tsx");
  const workCardClassMatch = homePage.match(
    /<article\s+className="([^"]*hover:bg-emerald-50\/40[^"]*)"/,
  );

  assert.match(homePage, /<Link\s+key=\{work\.name\}\s+to=\{work\.link\}/);
  assert.ok(workCardClassMatch);
  assert.match(workCardClassMatch[1], /transition-colors/);
  assert.doesNotMatch(workCardClassMatch[1], /hover:border-\[#009966\]/);
  assert.equal(homePage.match(/to=\{work\.link\}/g)?.length, 1);
});

test("homepage article list rows use the same green background hover transition", () => {
  const homePage = readHubFile("pages/home-page.tsx");
  const articleClassMatch = homePage.match(
    /<article\s+key=\{article\.title\}\s+className="([^"]+)"/,
  );

  assert.ok(articleClassMatch);
  assert.match(articleClassMatch[1], /transition-colors/);
  assert.match(articleClassMatch[1], /hover:bg-emerald-50\/40/);
  assert.match(articleClassMatch[1], /cursor-pointer/);
  assert.doesNotMatch(articleClassMatch[1], /hover:border-\[#009966\]/);
});
