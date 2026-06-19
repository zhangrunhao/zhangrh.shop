export type ProductStatus = "active" | "archived";

export type Product = {
  id: string;
  name: string;
  summary: string;
  link: string;
  coverImage: string;
  currentVersion: string;
  currentVersionCommitDate: string;
  status: ProductStatus;
};

export type Article = {
  id: string;
  name: string;
  summary: string;
  publishDate: string;
};

export type Review = {
  id: string;
  productName: string;
  version: string;
  headline: string;
  publishDate: string;
  dataChanges: string[];
  nextPlan: string;
};

export type HomeFeaturedWork = {
  name: string;
  summary: string;
  link: string;
  linkLabel: string;
};

export type HomeFeaturedArticle = {
  title: string;
  summary: string;
  date: string;
};

export type HomeAbout = {
  paragraphs: string[];
  email: string;
  github: string;
  aboutLink: string;
};

export type HomeData = {
  featuredWorks: HomeFeaturedWork[];
  featuredArticles: HomeFeaturedArticle[];
  about: HomeAbout;
};
