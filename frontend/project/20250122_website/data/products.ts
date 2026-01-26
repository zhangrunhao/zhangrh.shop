import coverDemo2 from "../assets/demo2.png";
import type { Product } from "../types";

export const PRODUCTS: Product[] = [
  {
    id: "card-game-demo",
    title: "卡牌游戏在线 Demo1",
    summary: "一番一瞪眼",
    description:
      "一个轻量级的在线卡牌策略原型，用于验证即时对战与回合节奏的可玩性。",
    url: "https://zhangrh.top/20250120_card-game01/",
    cover:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Princes_de_Florence_%28jeu%29.jpg/500px-Princes_de_Florence_%28jeu%29.jpg",
  },
  {
    id: "card-game-demo2",
    title: "卡牌游戏在线 Demo2",
    summary: "十五张卡牌, 抽5选3, 进行排列",
    description:
      "一个轻量级的在线卡牌策略原型，用于验证即时对战与回合节奏的可玩性。",
    url: "https://zhangrh.top/20250126-card_game02/",
    cover: coverDemo2,
  },
];
