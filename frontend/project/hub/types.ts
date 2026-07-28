export type WorkStatus = "active" | "archived";

export type Work = {
  id: string;
  name: string;
  summary: string;
  coverImage: string;
  status: WorkStatus;
  link: string;
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
  featuredWorkIds: string[];
  featuredArticles: HomeFeaturedArticle[];
  about: HomeAbout;
};
