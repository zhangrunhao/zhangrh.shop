export type ProductStatus = "active" | "archived";

export type Product = {
  id: string;
  name: string;
  summary: string;
  coverImage: string;
  currentVersion: string;
  currentVersionCommitDate: string;
  status: ProductStatus;
};

export type Idea = {
  id: string;
  name: string;
  summary: string;
  ideaDate: string;
};

export type Review = {
  id: string;
  productName: string;
  version: string;
  publishDate: string;
  dataChanges: string[];
  nextPlan: string;
};
