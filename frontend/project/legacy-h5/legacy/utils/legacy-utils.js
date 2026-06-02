export const toPercent = (point) => `${Number(point * 100).toFixed(2)}%`;

export const isFunc = (func) => func instanceof Function;

export const getRandomElementFromArray = (arr) =>
  arr[Math.floor(Math.random() * arr.length)];

export const isWeixin = () => false;

export const isAndroid = () => {
  const ua = navigator.userAgent;
  return ua.includes("Android") || ua.includes("Adr");
};

export const isIOS = () => /\(i[^;]+;( U;)? CPU.+Mac OS X/.test(navigator.userAgent);

export const getRandomNumBoth = (min, max) => {
  const range = max - min;
  return min + Math.round(Math.random() * range);
};

export const getStringCodeLength = (str) =>
  String(str)
    .split("")
    .reduce((length, char) => length + (char.charCodeAt(0) < 299 ? 1 : 2), 0);

export const produceRandomString = (length = 5) =>
  Array.from({ length }, () => Math.floor(Math.random() * 36).toString(36)).join("");
