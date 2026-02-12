import { useEffect, useMemo, useState } from "react";
import { Link } from "./components/link";
import ideasData from "./data/ideas.json";
import productsData from "./data/products.json";
import reviewsData from "./data/reviews.json";
import { normalizePath, withBase } from "./routing";
import type { Idea, Product, ProductStatus, Review } from "./types";

const PRODUCTS = productsData as Product[];
const IDEAS = ideasData as Idea[];
const REVIEWS = reviewsData as Review[];

const EMAIL_LINK = "mailto:runhaozhang.dev@gmail.com";
const GITHUB_LINK = "https://github.com/zhangrunhao";

type Route =
  | { name: "home" }
  | { name: "products" }
  | { name: "product-detail"; productId: string }
  | { name: "ideas" }
  | { name: "reviews" }
  | { name: "about" }
  | { name: "not-found" };

type NavItem = {
  label: string;
  to: string;
  routeName: Exclude<Route["name"], "not-found" | "product-detail" | "home">;
  icon: "product" | "idea" | "review" | "about";
};

const NAV_ITEMS: NavItem[] = [
  { label: "产品", to: "/products", routeName: "products", icon: "product" },
  { label: "想法", to: "/ideas", routeName: "ideas", icon: "idea" },
  { label: "复盘", to: "/reviews", routeName: "reviews", icon: "review" },
  { label: "关于", to: "/about", routeName: "about", icon: "about" },
];

const HOME_AREAS = [
  {
    to: "/products",
    title: "产品",
    description: "已上线且持续迭代",
    icon: "product",
    iconClassName: "bg-emerald-100 text-emerald-700",
    className: "border border-[#e5e5e5] bg-white",
  },
  {
    to: "/ideas",
    title: "想法",
    description: "想法、实验和原型",
    icon: "idea",
    iconClassName: "bg-amber-100 text-amber-700",
    className: "border-2 border-[#d4d4d4] bg-[rgba(255,251,235,0.3)]",
  },
  {
    to: "/reviews",
    title: "复盘",
    description: "每次发版的思考",
    icon: "review",
    iconClassName: "bg-blue-100 text-blue-700",
    className: "border border-[#e5e5e5] bg-white",
  },
] as const;

const resolveRoute = (pathname: string): Route => {
  const path = normalizePath(pathname);

  if (path === "/") {
    return { name: "home" };
  }
  if (path === "/products") {
    return { name: "products" };
  }
  if (path === "/ideas") {
    return { name: "ideas" };
  }
  if (path === "/reviews") {
    return { name: "reviews" };
  }
  if (path === "/about") {
    return { name: "about" };
  }

  const productDetailMatch = path.match(/^\/products\/([^/]+)$/);
  if (productDetailMatch?.[1]) {
    return { name: "product-detail", productId: decodeURIComponent(productDetailMatch[1]) };
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

const formatDateMonthDay = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatDateFull = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const resolveImageUrl = (coverImage: string) => {
  if (/^(https?:|data:|blob:)/i.test(coverImage)) {
    return coverImage;
  }
  const normalized = coverImage.startsWith("/") ? coverImage : `/${coverImage}`;
  return withBase(normalized);
};

const sortByDateDesc = <T,>(items: T[], getDate: (item: T) => string) => {
  return [...items].sort(
    (a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime(),
  );
};

const CalendarIcon = () => (
  <svg className="size-3" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M7 2V5M17 2V5M4 9H20M6 4H18C19.1046 4 20 4.89543 20 6V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V6C4 4.89543 4.89543 4 6 4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? "size-3.5"} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M3.5 8H12.5M12.5 8L9 4.5M12.5 8L9 11.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CubeIcon = () => (
  <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 3L20 7.5L12 12L4 7.5L12 3ZM4 7.5V16.5L12 21V12M20 7.5V16.5L12 21"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MailIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 6.5H20V17.5H4V6.5ZM4 7L12 13L20 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M9 18C5.5 19 5.5 16.5 4 16M14 20V17.5C14 16.4 14.1 16.1 13.5 15.5C16 15.2 18.5 14.2 18.5 10.5C18.5 9.5 18.1 8.6 17.5 7.8C17.7 7.2 17.8 6.2 17.3 5C17.3 5 16.5 4.7 14.5 6.1C13 5.7 11.5 5.7 10 6.1C8 4.7 7.2 5 7.2 5C6.7 6.2 6.8 7.2 7 7.8C6.4 8.6 6 9.5 6 10.5C6 14.2 8.5 15.2 11 15.5C10.4 16.1 10.4 16.7 10.5 17.5V20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ExternalIcon = () => (
  <svg className="size-3" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M10 3H13V6M13 3L8 8M6 4H4.5C3.67157 4 3 4.67157 3 5.5V11.5C3 12.3284 3.67157 13 4.5 13H10.5C11.3284 13 12 12.3284 12 11.5V10"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NavIcon = ({
  icon,
  active,
}: {
  icon: NavItem["icon"];
  active: boolean;
}) => {
  const className = `size-4 ${active ? "text-[#009966]" : "text-neutral-500"}`;

  if (icon === "product") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3L20 7.5L12 12L4 7.5L12 3ZM4 7.5V16.5L12 21V12M20 7.5V16.5L12 21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "idea") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 18H15M10 21H14M8 14C6.8 13 6 11.5 6 9.8C6 6.6 8.7 4 12 4C15.3 4 18 6.6 18 9.8C18 11.5 17.2 13 16 14C15.3 14.6 15 15.1 15 16H9C9 15.1 8.7 14.6 8 14Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "review") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 4H17M7 8H17M7 12H13M6 3H18C19.1 3 20 3.9 20 5V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V5C4 3.9 4.9 3 6 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 14C14.2 14 16 12.2 16 10C16 7.8 14.2 6 12 6C9.8 6 8 7.8 8 10C8 12.2 9.8 14 12 14ZM5 20C5.9 17.7 8.6 16 12 16C15.4 16 18.1 17.7 19 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const AreaIcon = ({ icon }: { icon: "product" | "idea" | "review" }) => {
  if (icon === "product") {
    return (
      <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3L20 7.5L12 12L4 7.5L12 3ZM4 7.5V16.5L12 21V12M20 7.5V16.5L12 21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "idea") {
    return (
      <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 18H15M10 21H14M8 14C6.8 13 6 11.5 6 9.8C6 6.6 8.7 4 12 4C15.3 4 18 6.6 18 9.8C18 11.5 17.2 13 16 14C15.3 14.6 15 15.1 15 16H9C9 15.1 8.7 14.6 8 14Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4H17M7 8H17M7 12H13M6 3H18C19.1 3 20 3.9 20 5V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V5C4 3.9 4.9 3 6 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const statusClassName: Record<ProductStatus, string> = {
  active: "bg-emerald-50 border-emerald-200 text-emerald-700",
  archived: "bg-neutral-100 border-neutral-300 text-neutral-600",
};

const AppHeader = ({ routeName }: { routeName: Route["name"] }) => (
  <header className="sticky top-0 z-30 border-b border-[#e5e5e5] bg-white/95 backdrop-blur-sm">
    <div className="mx-auto flex h-16 w-full max-w-[1216px] items-center justify-between">
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded px-1 py-1 text-neutral-900"
        ariaLabel="返回首页"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-xl bg-[#009966] text-sm font-bold text-white">
          P
        </span>
        <span className="text-lg font-medium tracking-tight">产品实验室</span>
      </Link>

      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            routeName === item.routeName ||
            (routeName === "product-detail" && item.routeName === "products");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative inline-flex h-8 items-center gap-1 rounded-xl px-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-50 text-[#009966]"
                  : "text-[#525252] hover:bg-white hover:text-neutral-900"
              }`}
            >
              <NavIcon icon={item.icon} active={active} />
              {item.label}
              {active ? (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#009966]" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  </header>
);

const SectionTitle = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: { label: string; to: string };
}) => (
  <div className="flex items-end justify-between gap-4">
    <div>
      <h2 className="text-[24px] font-medium leading-8 tracking-[0.0703px] text-[#171717]">{title}</h2>
      <p className="mt-1 text-base leading-6 tracking-[-0.3125px] text-[#525252]">{subtitle}</p>
    </div>
    {action ? (
      <Link
        to={action.to}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#525252] transition-colors hover:text-[#009966]"
      >
        {action.label}
        <ArrowIcon />
      </Link>
    ) : null}
  </div>
);

const ProductStatusBadge = ({ status }: { status: ProductStatus }) => (
  <span
    className={`inline-flex h-[22px] items-center rounded-full border px-2 text-xs font-medium ${statusClassName[status]}`}
  >
    {status === "active" ? "Active" : "Archived"}
  </span>
);

const ProductCard = ({ product }: { product: Product }) => (
  <article className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
    <div className="relative h-[334px] bg-neutral-100">
      <img
        src={resolveImageUrl(product.coverImage)}
        alt={product.name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute left-3 top-3">
        <ProductStatusBadge status={product.status} />
      </div>
    </div>

    <div className="space-y-3 px-5 py-5">
      <div className="flex items-center justify-between text-xs text-[#737373]">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#f5f5f5] px-2 py-0.5 text-[#525252]">
            {product.currentVersion}
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <CalendarIcon />
            {formatDateMonthDay(product.currentVersionCommitDate)}
          </span>
        </div>
      </div>

      <h3 className="text-[18px] font-semibold leading-[24.75px] tracking-[-0.02em] text-[#171717]">
        {product.name}
      </h3>
      <p className="text-sm leading-6 text-[#525252]">{product.summary}</p>
      <Link
        to={`/products/${product.id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#009966]"
      >
        查看详情
        <ArrowIcon />
      </Link>
    </div>
  </article>
);

const ReviewCard = ({ item }: { item: Review }) => {
  const summaryOne = item.dataChanges[0] ?? "-";
  const summaryTwo = item.dataChanges[1] ?? "-";

  return (
    <article className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-[inset_3px_0_0_0_#3b82f6]">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#737373]">
        <span className="rounded bg-[#f5f5f5] px-2 py-0.5 text-[#404040]">{item.productName}</span>
        <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">{item.version}</span>
        <span className="inline-flex items-center gap-1">
          <CalendarIcon />
          {formatDateMonthDay(item.publishDate)}
        </span>
      </div>

      <h3 className="mt-3 text-[18px] font-semibold leading-[24.75px] tracking-[-0.02em] text-[#171717]">
        {item.productName} {item.version} - 数据复盘
      </h3>

      <div className="mt-3 grid gap-4 text-xs leading-[19.5px] text-[#404040] md:grid-cols-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3px] text-[#009966]">数据变化</p>
          <p>{summaryOne}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3px] text-blue-600">影响</p>
          <p>{summaryTwo}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3px] text-orange-500">下一步</p>
          <p>{item.nextPlan}</p>
        </div>
      </div>
    </article>
  );
};

const HomePage = () => {
  const latestReviews = useMemo(
    () => sortByDateDesc(REVIEWS, (item) => item.publishDate).slice(0, 3),
    [],
  );

  return (
    <section className="pb-14">
      <div className="border-b border-[#e5e5e5] pb-20 pt-20 lg:pr-80">
        <span className="inline-flex h-[34px] items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium tracking-[-0.1504px] text-emerald-700">
          <span className="mr-2 size-2 rounded-full bg-[#00bc7d] opacity-90" />
          正在做有趣的产品
        </span>

        <h1 className="mt-6 text-5xl font-medium leading-[1.08] tracking-[-1.677px] text-[#171717] md:text-[72px]">
          设计 + 开发
        </h1>
        <p className="text-5xl font-medium leading-[1.08] tracking-[-1.677px] text-[#525252] md:text-[72px]">
          用代码实现想法
        </p>
        <p className="mt-6 max-w-[671px] text-base leading-8 tracking-[-0.4492px] text-[#525252] md:text-[20px]">
          从想法到产品，记录每一次迭代。这里是我的产品实验室，展示正在做的项目、探索的想法，以及每次发版的思考。
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/products"
            className="inline-flex h-[52px] items-center gap-2 rounded-xl bg-[#009966] px-7 text-base font-medium tracking-[-0.3125px] text-white shadow-sm"
          >
            <CubeIcon />
            查看产品
          </Link>
          <Link
            to="/reviews"
            className="inline-flex h-[52px] items-center gap-2 rounded-xl px-7 text-base font-medium tracking-[-0.3125px] text-[#404040]"
          >
            阅读复盘
            <ArrowIcon />
          </Link>
        </div>
      </div>

      <div className="border-b border-[#e5e5e5] pb-20 pt-20">
        <SectionTitle title="三个专区" subtitle="不同阶段的内容，统一的品质追求" />
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {HOME_AREAS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`group rounded-2xl px-6 pb-6 pt-6 transition hover:-translate-y-0.5 ${item.className}`}
            >
              <div className="mb-4 flex items-start justify-between">
                <span
                  className={`inline-flex size-10 items-center justify-center rounded-xl ${item.iconClassName}`}
                >
                  <AreaIcon icon={item.icon} />
                </span>
                <span className="text-neutral-400 transition group-hover:text-neutral-600">
                  <ArrowIcon className="size-4" />
                </span>
              </div>
              <h3 className="text-[18px] font-semibold leading-7 tracking-[-0.4395px] text-[#171717]">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-[#737373]">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-b border-[#e5e5e5] pb-20 pt-20">
        <SectionTitle
          title="正在做的产品"
          subtitle="持续迭代中"
          action={{ label: "查看全部", to: "/products" }}
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      <div className="pt-20">
        <SectionTitle
          title="最新复盘"
          subtitle="记录每次迭代的思考"
          action={{ label: "查看全部", to: "/reviews" }}
        />
        <div className="mt-6 space-y-4">
          {latestReviews.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ProductsPage = () => {
  const products = useMemo(
    () => sortByDateDesc(PRODUCTS, (item) => item.currentVersionCommitDate),
    [],
  );

  return (
    <section className="space-y-6 pb-14 pt-8">
      <div>
        <h1 className="text-[36px] font-semibold leading-[40px] tracking-[-0.03em] text-[#171717]">产品</h1>
        <p className="mt-3 text-base text-[#525252]">已上线且持续迭代的项目</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

const ProductDetailPage = ({ productId }: { productId: string }) => {
  const product = PRODUCTS.find((item) => item.id === productId);

  if (!product) {
    return (
      <section className="space-y-4 pb-14 pt-8">
        <h1 className="text-2xl font-semibold text-[#171717]">产品不存在</h1>
        <p className="text-[#525252]">未找到对应产品，请返回产品列表查看。</p>
        <div>
          <Link
            to="/products"
            className="inline-flex h-10 items-center rounded-xl bg-[#009966] px-4 text-sm font-medium text-white"
          >
            返回产品列表
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-14 pt-8">
      <div>
        <Link to="/products" className="inline-flex items-center gap-1 text-sm font-medium text-[#525252]">
          <ArrowIcon />
          返回产品列表
        </Link>
      </div>

      <article className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
        <div className="h-[420px] w-full overflow-hidden bg-neutral-100">
          <img src={resolveImageUrl(product.coverImage)} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-[#171717]">{product.name}</h1>
            <ProductStatusBadge status={product.status} />
          </div>

          <p className="text-sm leading-7 text-[#525252]">{product.summary}</p>

          <div className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 sm:grid-cols-2">
            <div>
              <p className="text-xs text-neutral-500">当前版本</p>
              <p className="mt-1 font-medium text-neutral-900">{product.currentVersion}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">版本提交日期</p>
              <p className="mt-1 font-medium text-neutral-900">
                {formatDateFull(product.currentVersionCommitDate)}
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
};

const IdeasPage = () => {
  const ideas = useMemo(() => sortByDateDesc(IDEAS, (item) => item.ideaDate), []);

  return (
    <section className="space-y-6 pb-14 pt-8">
      <div>
        <h1 className="text-[36px] font-semibold leading-[40px] tracking-[-0.03em] text-[#171717]">想法</h1>
        <p className="mt-3 text-base text-[#525252]">想法、实验和原型，还在探索中的创意</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ideas.map((idea) => (
          <article key={idea.id} className="rounded-2xl border border-[#e5e5e5] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[18px] font-semibold leading-[24.75px] tracking-[-0.02em] text-[#171717]">
                {idea.name}
              </h2>
              <span className="inline-flex items-center gap-1 text-xs text-[#737373]">
                <CalendarIcon />
                {formatDateMonthDay(idea.ideaDate)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#525252]">{idea.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

const ReviewsPage = () => {
  const reviews = useMemo(() => sortByDateDesc(REVIEWS, (item) => item.publishDate), []);

  return (
    <section className="space-y-6 pb-14 pt-8">
      <div>
        <h1 className="text-[36px] font-semibold leading-[40px] tracking-[-0.03em] text-[#171717]">复盘</h1>
        <p className="mt-3 text-base text-[#525252]">每次发版的复盘与反思，记录产品迭代的思考过程</p>
      </div>

      <div className="space-y-4">
        {reviews.map((item) => (
          <ReviewCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

const AboutPage = () => (
  <section className="space-y-6 pb-14 pt-8">
    <div>
      <h1 className="text-[36px] font-semibold leading-[40px] tracking-[-0.03em] text-[#171717]">关于</h1>
      <p className="mt-3 text-base text-[#525252]">个人产品实践者，持续用设计和开发把想法变成可用的产品</p>
    </div>

    <article className="rounded-2xl border border-[#e5e5e5] bg-white p-6">
      <h2 className="text-2xl font-semibold text-[#171717]">联系方式</h2>
      <p className="mt-3 text-sm leading-7 text-[#525252]">欢迎交流产品、设计和工程实现。</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to={EMAIL_LINK}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#009966] px-4 text-sm font-medium text-white"
        >
          <MailIcon />
          Email
        </Link>
        <Link
          to={GITHUB_LINK}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e5e5e5] bg-white px-4 text-sm font-medium text-[#404040]"
        >
          <GitHubIcon />
          GitHub
          <ExternalIcon />
        </Link>
      </div>
    </article>
  </section>
);

const NotFoundPage = () => (
  <section className="flex min-h-[50vh] items-center justify-center pb-14 pt-8">
    <div className="rounded-2xl border border-[#e5e5e5] bg-white px-8 py-12 text-center">
      <p className="text-6xl font-semibold tracking-tight text-[#171717]">404</p>
      <p className="mt-2 text-[#525252]">页面不存在</p>
      <div className="mt-5">
        <Link
          to="/"
          className="inline-flex h-10 items-center rounded-xl bg-[#009966] px-4 text-sm font-medium text-white"
        >
          返回首页
        </Link>
      </div>
    </div>
  </section>
);

const AppFooter = () => (
  <footer className="border-t border-[#e5e5e5] bg-[#fafafa]">
    <div className="mx-auto w-full max-w-[1280px] px-4 py-12 md:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[#171717]">产品实验室</h3>
          <p className="mt-2 text-sm text-[#525252]">打磨有趣的产品，记录开发过程，分享设计思考</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={EMAIL_LINK}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e5e5e5] bg-white px-4 text-sm font-medium text-[#404040]"
          >
            <MailIcon />
            Email
          </Link>
          <Link
            to={GITHUB_LINK}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e5e5e5] bg-white px-4 text-sm font-medium text-[#404040]"
          >
            <GitHubIcon />
            GitHub
            <ExternalIcon />
          </Link>
        </div>
      </div>

      <div className="mt-8 border-t border-[#e5e5e5] pt-6 text-center text-sm text-[#737373]">
        © 2026 产品实验室. All rights reserved.
      </div>
    </div>
  </footer>
);

export const App = () => {
  const pathname = usePathname();
  const route = useMemo(() => resolveRoute(pathname), [pathname]);

  useEffect(() => {
    if (route.name === "product-detail") {
      const product = PRODUCTS.find((item) => item.id === route.productId);
      document.title = product ? `${product.name} - 产品详情` : "产品详情";
      return;
    }

    const titleMap: Record<Exclude<Route["name"], "product-detail">, string> = {
      home: "产品实验室",
      products: "产品 - 产品实验室",
      ideas: "想法 - 产品实验室",
      reviews: "复盘 - 产品实验室",
      about: "关于 - 产品实验室",
      "not-found": "404 - 产品实验室",
    };
    document.title = titleMap[route.name];
  }, [route]);

  return (
    <div className="min-h-screen bg-[#fafafa] font-[Inter,Noto_Sans_SC,PingFang_SC,Microsoft_YaHei,sans-serif] text-[#171717]">
      <AppHeader routeName={route.name} />
      <main className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
        {route.name === "home" ? <HomePage /> : null}
        {route.name === "products" ? <ProductsPage /> : null}
        {route.name === "product-detail" ? <ProductDetailPage productId={route.productId} /> : null}
        {route.name === "ideas" ? <IdeasPage /> : null}
        {route.name === "reviews" ? <ReviewsPage /> : null}
        {route.name === "about" ? <AboutPage /> : null}
        {route.name === "not-found" ? <NotFoundPage /> : null}
      </main>
      <AppFooter />
    </div>
  );
};
