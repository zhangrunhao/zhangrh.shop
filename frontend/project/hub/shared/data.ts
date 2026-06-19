import articlesData from "../data/articles.json";
import homeData from "../data/home.json";
import productsData from "../data/products.json";
import reviewsData from "../data/reviews.json";
import type { Article, HomeData, Product, Review } from "../types";

export const PRODUCTS = productsData as Product[];
export const ARTICLES = articlesData as Article[];
export const REVIEWS = reviewsData as Review[];
export const HOME = homeData as HomeData;
