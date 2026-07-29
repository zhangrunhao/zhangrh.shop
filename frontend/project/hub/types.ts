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
  contentHtml: string;
};

export type HomeAbout = {
  paragraphs: string[];
  email: string;
  github: string;
  aboutLink: string;
};

export type HomeData = {
  featuredWorkIds: string[];
  about: HomeAbout;
};
