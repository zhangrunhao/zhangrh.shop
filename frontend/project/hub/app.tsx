import { useEffect, useMemo } from "react";
import { AppFooter } from "./components/app-footer";
import { AppHeader } from "./components/app-header";
import { AboutPage } from "./pages/about-page";
import { ArticlesPage } from "./pages/articles-page";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { ProductDetailPage } from "./pages/product-detail-page";
import { ProductsPage } from "./pages/products-page";
import { WORKS } from "./shared/data";
import { resolvePageName, trackHubLoadPage } from "./shared/tracking";
import { resolveRoute, usePathname } from "./shared/route";

export const App = () => {
  const pathname = usePathname();
  const route = useMemo(() => resolveRoute(pathname), [pathname]);

  useEffect(() => {
    if (route.name === "product-detail") {
      const work = WORKS.find((item) => item.id === route.productId);
      document.title = work ? `${work.name} - 作品详情` : "作品详情";
      return;
    }

    const titleMap = {
      home: "张润昊 - 前端开发者",
      products: "作品 - zhangrh.shop",
      articles: "文章 - zhangrh.shop",
      about: "关于我 - zhangrh.shop",
      "not-found": "404 - zhangrh.shop",
    } as const;
    document.title = titleMap[route.name];
  }, [route]);

  useEffect(() => {
    trackHubLoadPage(resolvePageName(route));
  }, [route]);

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
