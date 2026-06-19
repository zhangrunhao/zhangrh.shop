import type { Route } from "./route";
import type { HubButton } from "./tracking";

export const EMAIL_LINK = "mailto:runhaozhang.dev@gmail.com";
export const GITHUB_LINK = "https://github.com/zhangrunhao";

export type NavItem = {
  label: string;
  to: string;
  routeName: Exclude<Route["name"], "not-found" | "product-detail" | "home">;
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

export const HOME_AREAS = [
  {
    to: "/products",
    title: "作品",
    description: "已上线和正在打磨",
    icon: "product",
    iconClassName: "bg-emerald-100 text-emerald-600",
    hoverIconClassName: "group-hover:bg-emerald-600 group-hover:text-white",
    cardClassName: "border border-[#e5e5e5] bg-white",
    hoverBorderClassName: "hover:border-emerald-500",
    hoverArrowClassName: "group-hover:text-emerald-600",
  },
  {
    to: "/articles",
    title: "文章",
    description: "实践记录和产品思考",
    icon: "idea",
    iconClassName: "bg-amber-100 text-amber-600",
    hoverIconClassName: "group-hover:bg-amber-600 group-hover:text-white",
    cardClassName:
      "border-2 border-dashed border-[#d4d4d4] bg-[rgba(255,251,235,0.3)]",
    hoverBorderClassName: "hover:border-amber-400",
    hoverArrowClassName: "group-hover:text-amber-600",
  },
] as const;
