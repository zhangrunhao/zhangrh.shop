import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(currentDir, "..");

const readHubFile = (relativePath) =>
  fs.readFileSync(path.join(hubRoot, relativePath), "utf8");

test("about page uses the provided copy", () => {
  const aboutPage = readHubFile("pages/about-page.tsx");

  assert.match(aboutPage, />\s*关于我\s*</);
  assert.match(aboutPage, /我是一个前端开发者。/);
  assert.match(aboutPage, /这个网站用来放我做过的作品和写过的文章。/);
  assert.match(
    aboutPage,
    /我正在尝试用 AI 编程做一些真实项目，也会记录项目过程中的思考、问题和复盘。/,
  );
  assert.match(
    aboutPage,
    /你可以在这里看到我的作品、文章，以及我对 AI 编程和独立开发的一些实践。/,
  );
});

test("about page shows the provided contact details", () => {
  const aboutPage = readHubFile("pages/about-page.tsx");
  const constants = readHubFile("shared/constants.ts");

  assert.match(aboutPage, />\s*联系方式\s*</);
  assert.match(aboutPage, /GitHub:\s*/);
  assert.match(aboutPage, /Email:\s*/);
  assert.match(aboutPage, /https:\/\/github\.com\/zhangrunhao/);
  assert.match(aboutPage, /runhaozhang\.dev@gmail\.com/);
  assert.match(constants, /GITHUB_LINK = "https:\/\/github\.com\/zhangrunhao"/);
  assert.match(constants, /EMAIL_LINK = "mailto:runhaozhang\.dev@gmail\.com"/);
});

test("about page removes old introduction copy", () => {
  const aboutPage = readHubFile("pages/about-page.tsx");

  assert.doesNotMatch(aboutPage, /个人产品实践者/);
  assert.doesNotMatch(aboutPage, /持续用设计和开发把想法变成可用的产品/);
  assert.doesNotMatch(aboutPage, /欢迎交流产品、设计和工程实现。/);
});
