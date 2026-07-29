import type { Route } from "./route";
import type { HubButton } from "./tracking";

export const EMAIL_LINK = "mailto:runhaozhang.dev@gmail.com";
export const GITHUB_LINK = "https://github.com/zhangrunhao";

export type NavItem = {
  label: string;
  to: string;
  routeName: Exclude<Route["name"], "not-found" | "home">;
  icon: "product" | "idea" | "about";
  button: Extract<
    HubButton,
    "nav_product" | "nav_articles" | "nav_about"
  >;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "作品",
    to: "/products",
    routeName: "products",
    icon: "product",
    button: "nav_product",
  },
  {
    label: "文章",
    to: "/articles",
    routeName: "articles",
    icon: "idea",
    button: "nav_articles",
  },
  {
    label: "关于我",
    to: "/about",
    routeName: "about",
    icon: "about",
    button: "nav_about",
  },
];
