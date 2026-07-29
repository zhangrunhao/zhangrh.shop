import { ArrowIcon, CalendarIcon } from "../components/icons";
import { Link } from "../components/link";
import { ARTICLES } from "../shared/articles";
import { formatDateYmd } from "../shared/format";
import { NotFoundPage } from "./not-found-page";

export const ArticleDetailPage = ({ articleId }: { articleId: string }) => {
  const article = ARTICLES.find((article) => article.id === articleId);

  if (!article) {
    return <NotFoundPage />;
  }

  return (
    <section className="pb-16 pt-8">
      <div className="mx-auto max-w-[800px]">
        <Link
          to="/articles"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#525252] transition-colors hover:text-[#009966]"
        >
          <ArrowIcon />
          返回文章列表
        </Link>

        <article className="mt-8">
          <header className="border-b border-[#e5e5e5] pb-8">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#171717] md:text-[40px]">
              {article.name}
            </h1>
            <time
              dateTime={article.publishDate}
              className="mt-5 inline-flex items-center gap-1.5 text-sm text-[#737373]"
            >
              <CalendarIcon />
              {formatDateYmd(article.publishDate)}
            </time>
          </header>

          <div
            className="article-content mt-8"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
        </article>
      </div>
    </section>
  );
};
