import type { Route } from "./route";

export const EMAIL_LINK = "mailto:runhaozhang.dev@gmail.com";
export const GITHUB_LINK = "https://github.com/zhangrunhao";

export type NavItem = {
  label: string;
  to: string;
  routeName: Exclude<Route["name"], "not-found" | "home">;
  icon: "product" | "idea" | "about";
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "作品",
    to: "/products",
    routeName: "products",
    icon: "product",
  },
  {
    label: "文章",
    to: "/articles",
    routeName: "articles",
    icon: "idea",
  },
  {
    label: "关于我",
    to: "/about",
    routeName: "about",
    icon: "about",
  },
];
