import { useEffect, useMemo } from "react";
import { AppFooter } from "./components/app-footer";
import { AppHeader } from "./components/app-header";
import { AboutPage } from "./pages/about-page";
import { ArticlesPage } from "./pages/articles-page";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { ProductDetailPage } from "./pages/product-detail-page";
import { ProductsPage } from "./pages/products-page";
import { ZhengtianPage } from "./pages/zhengtian-page";
import { PRODUCTS } from "./shared/data";
import { resolvePageName, trackHubLoadPage } from "./shared/tracking";
import { resolveRoute, usePathname } from "./shared/route";

export const App = () => {
  const pathname = usePathname();
  const route = useMemo(() => resolveRoute(pathname), [pathname]);

  useEffect(() => {
    if (route.name === "product-detail") {
      const product = PRODUCTS.find((item) => item.id === route.productId);
      document.title = product ? `${product.name} - 作品详情` : "作品详情";
      return;
    }

    const titleMap = {
      home: "张润昊 - 前端开发者",
      products: "作品 - zhangrh.shop",
      articles: "文章 - zhangrh.shop",
      about: "关于我 - zhangrh.shop",
      zhengtian: "时间线web - 组件库",
      "not-found": "404 - zhangrh.shop",
    } as const;
    document.title = titleMap[route.name];
  }, [route]);

  useEffect(() => {
    trackHubLoadPage(resolvePageName(route));
  }, [route]);

  if (route.name === "zhengtian") {
    return (
      <div className="min-h-screen bg-white font-['SF_Pro_Text','SF_Pro_Display','PingFang_SC','Hiragino_Sans_GB','Microsoft_YaHei',sans-serif] text-[#333333]">
        <ZhengtianPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-[Inter,Noto_Sans_SC,PingFang_SC,Microsoft_YaHei,sans-serif] text-[#171717]">
      <AppHeader routeName={route.name} />
      <main className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
        {route.name === "home" ? <HomePage /> : null}
        {route.name === "products" ? <ProductsPage /> : null}
        {route.name === "product-detail" ? (
          <ProductDetailPage productId={route.productId} />
        ) : null}
        {route.name === "articles" ? <ArticlesPage /> : null}
        {route.name === "about" ? <AboutPage /> : null}
        {route.name === "not-found" ? <NotFoundPage /> : null}
      </main>
      <AppFooter />
    </div>
  );
};
