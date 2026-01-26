import { marked } from "marked";
import { useEffect, useMemo, useState } from "react";
import { BlogListPage } from "./components/blog-list-page";
import { Link } from "./components/link";
import { PostList } from "./components/post-list";
import { ProductGrid } from "./components/product-grid";
import { ProductListPage } from "./components/product-list-page";
import { PRODUCTS } from "./data/products";
import { normalizePath } from "./routing";
import type { Post, Product } from "./types";
import { formatDate } from "./utils/date";

type Route =
  | { name: "home" }
  | { name: "blogs" }
  | { name: "blog"; id: string }
  | { name: "products" }
  | { name: "product"; id: string }
  | { name: "not-found" };

const RSS_URL = "https://zhangrh.top/rss.xml";
const XHS_URL = "https://xhslink.com/m/8PQZLZZjZmd";
const BILIBILI_URL = "https://space.bilibili.com/3691001308777268";
const CNBLOGS_URL = "https://www.cnblogs.com/zhangrunhao";
const GITHUB_URL = "https://github.com/zhangrunhao";
const SOCIAL_LINK_BASE =
  "inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md";

const RAW_POSTS = import.meta.glob("./content/posts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

marked.setOptions({
  breaks: true,
  mangle: false,
  headerIds: false,
});

const POSTS: Post[] = Object.entries(RAW_POSTS)
  .map(([filePath, raw]) => parsePost(filePath, raw))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const NAV_ITEMS = [
  { label: "个人首页", to: "/" },
  { label: "博客文章", to: "/blogs" },
  { label: "产品列表", to: "/products" },
];

const resolveRoute = (pathname: string): Route => {
  const path = normalizePath(pathname);
  if (path === "/") {
    return { name: "home" };
  }
  if (path === "/blogs") {
    return { name: "blogs" };
  }
  if (path === "/products") {
    return { name: "products" };
  }
  const blogMatch = path.match(/^\/blogs\/([^/]+)$/);
  if (blogMatch) {
    return { name: "blog", id: blogMatch[1] };
  }
  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    return { name: "product", id: productMatch[1] };
  }
  return { name: "not-found" };
};

const usePathname = () => {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePop = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  return pathname;
};

const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path
      d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
      fill="currentColor"
    />
  </svg>
);

const AppHeader = ({ currentPath }: { currentPath: string }) => {
  const normalized = normalizePath(currentPath);
  return (
    <aside className="-ml-[8px] mb-16 tracking-tight">
      <div className="lg:sticky lg:top-20">
        <nav
          className="flex flex-row items-start relative px-0 pb-0 md:overflow-auto scroll-pr-6 md:relative"
          id="nav"
        >
          <div className="flex flex-row space-x-0 pr-10">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.to === "/"
                  ? normalized === "/"
                  : normalized.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`transition-all hover:text-neutral-800 flex align-middle relative py-1 px-2 m-1 ${
                    isActive
                      ? "text-neutral-900 font-semibold"
                      : "text-neutral-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
};

const AppFooter = () => (
  <footer className="mb-16">
    <ul className="text-sm mt-8 flex flex-col space-x-0 space-y-2 text-neutral-600 md:flex-row md:space-x-4 md:space-y-0">
      <li>
        <Link
          to={RSS_URL}
          className="flex items-center transition-all hover:text-neutral-800"
        >
          <ArrowIcon />
          <p className="ml-2 h-7">rss</p>
        </Link>
      </li>
      <li>
        <Link
          to={GITHUB_URL}
          className="flex items-center transition-all hover:text-neutral-800"
        >
          <ArrowIcon />
          <p className="ml-2 h-7">github</p>
        </Link>
      </li>
    </ul>
  </footer>
);

const HomePage = () => (
  <section>
    <div className="mb-10">
      <h1 className="text-2xl font-semibold tracking-tighter">
        做可上线的小产品
      </h1>
      <p className="mt-3 text-sm text-neutral-600">
        大厂前端｜做可上线的小产品｜记录产品日记与技术复盘
      </p>
      <p className="mt-6 text-neutral-800">
        前端开发者，在大厂做了很多年线上项目。现在更想把时间花在“真实有用”的事情上：做一些自己感兴趣、
        也真的能上线的小产品，把灵感、踩坑和迭代记录下来，放在这里当作我的产品日记。
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={XHS_URL} className={`${SOCIAL_LINK_BASE} bg-[#fff5f7]`}>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ff2442] text-[10px] font-semibold text-white"
            aria-hidden
          >
            小
          </span>
          小红书
        </Link>
        <Link to={BILIBILI_URL} className={`${SOCIAL_LINK_BASE} bg-[#f2f7ff]`}>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#4c9bfd] text-[10px] font-semibold text-white"
            aria-hidden
          >
            B
          </span>
          B站
        </Link>
        <Link to={CNBLOGS_URL} className={`${SOCIAL_LINK_BASE} bg-[#f4fff6]`}>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#16a34a] text-[10px] font-semibold text-white"
            aria-hidden
          >
            园
          </span>
          博客园
        </Link>
        <Link to={GITHUB_URL} className={`${SOCIAL_LINK_BASE} bg-[#f6f6f6]`}>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold text-white"
            aria-hidden
          >
            GH
          </span>
          GitHub
        </Link>
      </div>
    </div>
    <div className="mt-10">
      <h2 className="mb-6 text-xl font-semibold tracking-tight">
        <Link
          to="/blogs"
          className="inline-flex items-center gap-2 text-neutral-900 transition-colors hover:text-neutral-800 hover:underline"
          ariaLabel="前往博客列表"
        >
          文档列表
          <ArrowIcon />
        </Link>
      </h2>
      <PostList posts={POSTS} />
    </div>
    <div className="mt-12">
      <h2 className="mb-6 text-xl font-semibold tracking-tight">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-neutral-900 transition-colors hover:text-neutral-800 hover:underline"
          ariaLabel="前往产品列表"
        >
          产品列表
          <ArrowIcon />
        </Link>
      </h2>
      <ProductGrid products={PRODUCTS} />
    </div>
  </section>
);

const BlogDetailPage = ({ post }: { post: Post }) => (
  <section>
    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Blog</p>
    <h1 className="mt-3 text-2xl font-semibold tracking-tighter">
      {post.title}
    </h1>
    <p className="mt-2 text-sm text-neutral-600">{formatDate(post.date)}</p>
    <div
      className="mt-6 text-[15px] leading-7 text-neutral-800 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tighter [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:list-disc [&_ol]:list-decimal [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:py-0.5"
      dangerouslySetInnerHTML={{ __html: post.html }}
    />
  </section>
);

const ProductDetailPage = ({ product }: { product: Product }) => (
  <section>
    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
      Product
    </p>
    <h1 className="mt-3 text-2xl font-semibold tracking-tighter">
      {product.title}
    </h1>
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_200px]">
      <div>
        <p className="text-neutral-800 mb-4">{product.description}</p>
        <p className="text-sm text-neutral-600">
          产品地址：
          <Link to={product.url} className="ml-2 underline">
            {product.url}
          </Link>
        </p>
      </div>
      <img
        className="w-full rounded-xl border border-neutral-200/80"
        src={product.cover}
        alt={product.title}
      />
    </div>
  </section>
);

const NotFoundPage = () => (
  <section className="py-20 text-center">
    <h1 className="text-4xl font-semibold tracking-tight">404</h1>
    <p className="mt-3 text-neutral-600">这个页面没有找到。</p>
    <div className="mt-8">
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-full border border-neutral-900 px-4 py-2 text-sm transition-colors hover:bg-neutral-900 hover:text-white"
      >
        回到首页
      </Link>
    </div>
  </section>
);

export const App = () => {
  const pathname = usePathname();
  const route = useMemo(() => resolveRoute(pathname), [pathname]);

  useEffect(() => {
    const titleMap: Record<Route["name"], string> = {
      home: "首页",
      blogs: "博客",
      blog: "博客",
      products: "产品",
      product: "产品",
      "not-found": "404",
    };
    document.title = titleMap[route.name];
  }, [route]);

  const blogPost =
    route.name === "blog" ? POSTS.find((post) => post.id === route.id) : null;
  const product =
    route.name === "product"
      ? PRODUCTS.find((item) => item.id === route.id)
      : null;

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <main className="antialiased max-w-xl mx-4 mt-8 lg:mx-auto flex flex-col">
        <AppHeader currentPath={pathname} />
        <div className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0">
          {route.name === "home" && <HomePage />}
          {route.name === "blogs" && <BlogListPage posts={POSTS} />}
          {route.name === "blog" && blogPost && (
            <BlogDetailPage post={blogPost} />
          )}
          {route.name === "products" && <ProductListPage products={PRODUCTS} />}
          {route.name === "product" && product && (
            <ProductDetailPage product={product} />
          )}
          {route.name === "blog" && !blogPost && <NotFoundPage />}
          {route.name === "product" && !product && <NotFoundPage />}
          {route.name === "not-found" && <NotFoundPage />}
          <AppFooter />
        </div>
      </main>
    </div>
  );
};

function parsePost(filePath: string, raw: string): Post {
  const frontmatterMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*/);
  const frontmatter = frontmatterMatch
    ? parseFrontmatter(frontmatterMatch[1])
    : {};
  const content = frontmatterMatch
    ? raw.slice(frontmatterMatch[0].length)
    : raw;
  const fileName = filePath.split("/").pop()?.replace(/\.md$/, "") ?? "post";
  const id = frontmatter.slug || fileName;
  const title = frontmatter.title || fileName;
  const date = frontmatter.date || "1970-01-01";
  const summary = frontmatter.summary || "";
  const html = marked.parse(content.trim());

  return {
    id,
    title,
    date,
    summary,
    content: content.trim(),
    html,
  };
}

function parseFrontmatter(source: string) {
  const result: Record<string, string> = {};
  source.split("\n").forEach((line) => {
    const [rawKey, ...rest] = line.split(":");
    if (!rawKey || rest.length === 0) {
      return;
    }
    const key = rawKey.trim();
    const value = rest.join(":").trim();
    if (key && value) {
      result[key] = value;
    }
  });
  return result;
}
