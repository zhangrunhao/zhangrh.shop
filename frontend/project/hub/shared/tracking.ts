import { track } from "../../../common/track";
import type { Route } from "./route";

export const HUB_PROJECT = "hub";

export type HubPageName =
  | "home"
  | "products"
  | "product_detail"
  | "ideas"
  | "reviews"
  | "about"
  | "zhengtian"
  | "not_found";

export type HubButton =
  | "nav_product"
  | "nav_ideas"
  | "nav_reviews"
  | "nav_about"
  | "main_view_products"
  | "main_view_reviews";

export const resolvePageName = (route: Route): HubPageName => {
  if (route.name === "product-detail") {
    return "product_detail";
  }
  if (route.name === "not-found") {
    return "not_found";
  }
  return route.name;
};

export const trackHubLoadPage = (pageName: HubPageName) => {
  track({
    event: "load_page",
    project: HUB_PROJECT,
    params: { page_name: pageName },
  });
};

export const trackHubClick = (button: HubButton) => {
  track({
    event: "click",
    project: HUB_PROJECT,
    params: { button },
  });
};
