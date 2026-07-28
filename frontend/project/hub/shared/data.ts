import articlesData from "../data/articles.json";
import homeData from "../data/home.json";
import productsData from "../data/products.json";
import type { Article, HomeData, Product } from "../types";

export const PRODUCTS = productsData as Product[];
export const ARTICLES = articlesData as Article[];
export const HOME = homeData as HomeData;
