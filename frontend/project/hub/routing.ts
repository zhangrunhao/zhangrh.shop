export const RAW_BASE = import.meta.env.BASE_URL ?? "/";
export const BASE_PATH = RAW_BASE === "/" ? "" : RAW_BASE.replace(/\/$/, "");

export const stripBase = (pathname: string) => {
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    const next = pathname.slice(BASE_PATH.length);
    if (!next) {
      return "/";
    }
    return next.startsWith("/") ? next : `/${next}`;
  }
  return pathname || "/";
};

export const normalizePath = (pathname: string) => {
  const trimmed = stripBase(pathname).replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

export const withBase = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return BASE_PATH ? `${BASE_PATH}${normalized}` : normalized;
};
