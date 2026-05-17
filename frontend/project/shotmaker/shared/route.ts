export type Route =
  | { name: "support" }
  | { name: "privacy" }
  | { name: "not-found" };

export const RAW_BASE = import.meta.env.BASE_URL ?? "/";
export const BASE_PATH = RAW_BASE === "/" ? "" : RAW_BASE.replace(/\/$/, "");
export const PROJECT_PATH = "/shotmaker";

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
  const baseStripped = stripBase(pathname);
  const projectStripped = baseStripped.startsWith(`${PROJECT_PATH}/`)
    ? baseStripped.slice(PROJECT_PATH.length)
    : baseStripped === PROJECT_PATH
      ? "/"
      : baseStripped;
  const trimmed = projectStripped.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

export const withBase = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return BASE_PATH ? `${BASE_PATH}${normalized}` : normalized;
};

export const resolveRoute = (pathname: string): Route => {
  const path = normalizePath(pathname);

  if (path === "/" || path === "/support") {
    return { name: "support" };
  }
  if (path === "/privacy") {
    return { name: "privacy" };
  }

  return { name: "not-found" };
};
