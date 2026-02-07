import cardgameCover from "../assets/cardgame.png";
import type { Product } from "../types";

export const PRODUCTS: Product[] = [
  {
    id: "card-game",
    title: "卡牌游戏",
    summary: "一个在线的卡牌游戏, 在努力找到同时掀牌的的最小game点",
    description:
      "一个轻量级的在线卡牌策略原型，用于验证即时对战与回合节奏的可玩性。",
    url: "https://zhangrh.top/cardgame/",
    cover: cardgameCover,
  },
];
