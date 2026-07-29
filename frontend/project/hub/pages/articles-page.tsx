import { useMemo } from "react";
import { CalendarIcon } from "../components/icons";
import { Link } from "../components/link";
import { ARTICLES } from "../shared/articles";
import { formatDateYmd, sortByDateDesc } from "../shared/format";

export const ArticlesPage = () => {
  const articles = useMemo(
    () => sortByDateDesc(ARTICLES, (item) => item.publishDate),
    [],
  );

  return (
    <section className="pb-14 pt-8">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h1 className="text-[36px] font-semibold leading-[40px] tracking-normal text-[#171717]">
            文章
          </h1>
          <p className="text-base leading-7 tracking-normal text-[#525252]">
            记录技术实践、读书笔记与产品思考。
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {articles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#d4d4d4] bg-white px-5 py-10 text-center text-sm text-[#737373]">
              没有已发布的文章。
            </div>
          ) : null}
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.id}`}
              className="block rounded-lg border border-[#e5e5e5] bg-white p-5 transition-colors hover:border-[#009966] md:p-6"
            >
              <article>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-[18px] font-semibold leading-7 tracking-normal text-[#171717]">
                      {article.name}
                    </h2>
                    <p className="mt-2 text-sm leading-6 tracking-normal text-[#525252]">
                      {article.summary}
                    </p>
                  </div>
                  <div className="inline-flex shrink-0 items-center gap-1.5 text-sm tracking-normal text-[#737373]">
                    <CalendarIcon />
                    {formatDateYmd(article.publishDate)}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
