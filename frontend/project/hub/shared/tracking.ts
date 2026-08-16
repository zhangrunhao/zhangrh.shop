import { track } from "../../../common/track";
import type { Route } from "./route";

export const HUB_PROJECT = "hub";

export const HUB_EVENTS = [
  "home_page_load",
  "products_page_load",
  "articles_page_load",
  "article_detail_page_load",
  "about_page_load",
] as const;

export type HubEvent = (typeof HUB_EVENTS)[number];

export const resolveHubPageEvent = (route: Route): HubEvent | null => {
  if (route.name === "home") {
    return "home_page_load";
  }
  if (route.name === "products") {
    return "products_page_load";
  }
  if (route.name === "articles") {
    return "articles_page_load";
  }
  if (route.name === "about") {
    return "about_page_load";
  }
  return null;
};

export const trackHubEvent = (event: HubEvent) =>
  track({ event, project: HUB_PROJECT });
