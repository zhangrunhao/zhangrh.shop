import test from "node:test";
import assert from "node:assert/strict";
import {
  APP_NAME,
  CONTACT_EMAIL,
  EFFECTIVE_DATE,
  HOME_PATH,
  LAST_UPDATED,
  PRIVACY_PATH,
  SUPPORT_PATH,
  homeContent,
  privacyPage,
  supportPage,
} from "./content";

const allText = JSON.stringify({ homeContent, supportPage, privacyPage });

test("WebTrace publishes stable brand, contact, route, and date constants", () => {
  assert.equal(APP_NAME, "WebTrace");
  assert.equal(CONTACT_EMAIL, "zhangrhweb@gmail.com");
  assert.equal(HOME_PATH, "/webtrace/");
  assert.equal(SUPPORT_PATH, "/webtrace/support");
  assert.equal(PRIVACY_PATH, "/webtrace/privacy");
  assert.equal(EFFECTIVE_DATE, "September 3, 2026");
  assert.equal(LAST_UPDATED, "2026-09-03");
});

test("WebTrace content matches the implemented local data boundary", () => {
  for (const phrase of [
    "网站名称和可注册主域名",
    "打开时间、结束时间和有效观看时长",
    "chrome.storage.local",
    "chrome.storage.session",
    "IndexedDB",
    "不保存完整 URL、路径、查询参数、网页标题、网页内容、输入内容或 Cookie",
    "不上传、不出售、不用于广告，也不与第三方共享",
    "默认长期保留",
    "删除历史会保留网站配置并继续统计",
    "Chrome Web Store User Data Policy",
    "Limited Use",
  ]) {
    assert.match(allText, new RegExp(phrase));
  }
});

test("WebTrace privacy policy states the same material facts in English", () => {
  for (const phrase of [
    "website name and registrable domain",
    "opening time, ending time, active viewing intervals, and duration",
    "stored only in the current Chrome profile on your device",
    "retained indefinitely by default",
    "permanently delete visit history for one configured website",
    "does not upload, sell, use for advertising, or share",
    "Limited Use requirements",
  ]) {
    assert.match(allText, new RegExp(phrase, "i"));
  }
});

test("WebTrace content explains real behavior without inventing unavailable features", () => {
  assert.match(allText, /离开并重新进入/);
  assert.match(allText, /设备未锁屏/);
  assert.match(allText, /鼠标长按网站/);
  assert.match(allText, /最近 14 天/);
  assert.match(allText, new RegExp(CONTACT_EMAIL));
  assert.doesNotMatch(allText, /已上架/);
  assert.doesNotMatch(allText, /云同步/);
  assert.doesNotMatch(allText, /限制使用时长/);
});
