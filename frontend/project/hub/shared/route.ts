import { useEffect, useState } from "react";
import { normalizePath } from "../routing";

export type Route =
  | { name: "home" }
  | { name: "products" }
  | { name: "product-detail"; productId: string }
  | { name: "ideas" }
  | { name: "reviews" }
  | { name: "about" }
  | { name: "zhengtian" }
  | { name: "not-found" };

export const resolveRoute = (pathname: string): Route => {
  const path = normalizePath(pathname);

  if (path === "/") {
    return { name: "home" };
  }
  if (path === "/products") {
    return { name: "products" };
  }
  if (path === "/ideas") {
    return { name: "ideas" };
  }
  if (path === "/reviews") {
    return { name: "reviews" };
  }
  if (path === "/about") {
    return { name: "about" };
  }
  if (path === "/zhengtian") {
    return { name: "zhengtian" };
  }

  const productDetailMatch = path.match(/^\/products\/([^/]+)$/);
  if (productDetailMatch?.[1]) {
    return {
      name: "product-detail",
      productId: decodeURIComponent(productDetailMatch[1]),
    };
  }

  return { name: "not-found" };
};

export const usePathname = () => {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePop = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  return pathname;
};
