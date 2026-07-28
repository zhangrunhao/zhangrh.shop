import articlesData from "../data/articles.json";
import homeData from "../data/home.json";
import reviewsData from "../data/reviews.json";
import worksData from "../data/works.json";
import type { Article, HomeData, Review, Work } from "../types";
import { resolveWorkAsset } from "./work-assets";

export const ARTICLES = articlesData as Article[];
export const REVIEWS = reviewsData as Review[];
export const HOME = homeData as HomeData;

export const WORKS = (worksData as Work[]).map((work) => ({
  ...work,
  coverImage: resolveWorkAsset(work.coverImage),
}));

const worksById = new Map(WORKS.map((work) => [work.id, work]));

export const FEATURED_WORKS = HOME.featuredWorkIds.map((id) => {
  const work = worksById.get(id);
  if (!work) {
    throw new Error(`Featured work not found: ${id}`);
  }
  return work;
});
