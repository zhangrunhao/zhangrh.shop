const $ = window.$ || window.jQuery || window.Zepto;

if (!$) {
  throw new Error("Legacy runtime $ is missing. Load jquery or zepto before the module entry.");
}

export default $;
