import { HOME } from "../shared/data";
import { formatDateYmd } from "../shared/format";
import { trackHubClick } from "../shared/tracking";
import {
  ArrowIcon,
  CalendarIcon,
  CubeIcon,
  ExternalIcon,
  GitHubIcon,
  MailIcon,
} from "../components/icons";
import { Link } from "../components/link";

const sectionHeadingClassName =
  "text-[28px] font-semibold leading-9 tracking-normal text-[#171717]";

export const HomePage = () => {
  return (
    <section className="pb-16">
      <div className="border-b border-[#e5e5e5] py-16 md:py-20">
        <div>
          <span className="inline-flex h-8 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium tracking-normal text-emerald-700">
            AI 编程 · 前端开发 · 独立产品
          </span>

          <h1 className="mt-6 max-w-[900px] text-[32px] font-medium leading-[1.18] tracking-normal text-[#171717] md:text-[44px] md:leading-[1.14]">
            前端开发者，用 AI 编程做真实作品。
          </h1>
          <p className="mt-4 max-w-[560px] text-base leading-7 tracking-normal text-[#525252]">
            这里记录我的前端作品、AI 编程实践和产品思考。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#featured-works"
              onClick={() => trackHubClick("main_view_products")}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#009966] px-5 text-base font-medium tracking-normal text-white shadow-sm transition-colors hover:bg-[#00885c]"
            >
              <CubeIcon />
              查看作品
            </a>
            <a
              href="#featured-articles"
              onClick={() => trackHubClick("main_view_reviews")}
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#d4d4d4] bg-white px-5 text-base font-medium tracking-normal text-[#404040] transition-colors hover:border-[#009966] hover:text-[#009966]"
            >
              阅读文章
              <ArrowIcon />
            </a>
          </div>
        </div>
      </div>

      <div
        id="featured-works"
        className="scroll-mt-24 border-b border-[#e5e5e5] pb-20 pt-20"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className={sectionHeadingClassName}>作品</h2>
          <Link
            to="/products"
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-[#d4d4d4] bg-white px-4 text-sm font-medium tracking-normal text-[#404040] transition-colors hover:border-[#009966] hover:text-[#009966] md:self-auto"
          >
            查看更多
            <ArrowIcon />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {HOME.featuredWorks.map((work) => (
            <article
              key={work.name}
              className="flex flex-col rounded-lg border border-[#e5e5e5] bg-white p-5 transition-colors hover:border-[#009966]"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[20px] font-semibold leading-7 tracking-normal text-[#171717]">
                  {work.name}
                </h3>
                <span className="rounded-md bg-[#f5f5f5] px-2 py-1 text-xs font-medium tracking-normal text-[#737373]">
                  Work
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 tracking-normal text-[#525252]">
                {work.summary}
              </p>
              <Link
                to={work.link}
                className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium tracking-normal text-[#009966]"
              >
                {work.linkLabel}
                <ArrowIcon />
              </Link>
            </article>
          ))}
        </div>
      </div>

      <div
        id="featured-articles"
        className="scroll-mt-24 border-b border-[#e5e5e5] pb-20 pt-20"
      >
        <h2 className={sectionHeadingClassName}>文章</h2>

        <div className="mt-8 divide-y divide-[#e5e5e5] rounded-lg border border-[#e5e5e5] bg-white shadow-sm">
          {HOME.featuredArticles.map((article) => (
            <article key={article.title} className="p-5 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h3 className="text-[18px] font-semibold leading-7 tracking-normal text-[#171717]">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 tracking-normal text-[#525252]">
                    {article.summary}
                  </p>
                </div>
                <time className="inline-flex shrink-0 items-center gap-1 text-sm tracking-normal text-[#737373]">
                  <CalendarIcon />
                  {formatDateYmd(article.date)}
                </time>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="pt-20">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <h2 className={sectionHeadingClassName}>关于我</h2>
            <div className="mt-5 max-w-3xl text-base leading-8 tracking-normal text-[#525252]">
              {HOME.about.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <Link
              to={HOME.about.email}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#009966] px-4 text-sm font-medium tracking-normal text-white transition-colors hover:bg-[#00885c]"
            >
              <MailIcon />
              Email
            </Link>
            <Link
              to={HOME.about.github}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d4d4d4] bg-white px-4 text-sm font-medium tracking-normal text-[#404040] transition-colors hover:border-[#171717] hover:text-[#171717]"
            >
              <GitHubIcon />
              GitHub
              <ExternalIcon />
            </Link>
            <Link
              to={HOME.about.aboutLink}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d4d4d4] bg-white px-4 text-sm font-medium tracking-normal text-[#404040] transition-colors hover:border-[#009966] hover:text-[#009966]"
            >
              了解更多
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
