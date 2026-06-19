import { EMAIL_LINK, GITHUB_LINK } from "../shared/constants";
import { ExternalIcon, GitHubIcon, MailIcon } from "../components/icons";
import { Link } from "../components/link";

const aboutParagraphs = [
  "我是一个前端开发者。",
  "这个网站用来放我做过的作品和写过的文章。",
  "我正在尝试用 AI 编程做一些真实项目，也会记录项目过程中的思考、问题和复盘。",
  "你可以在这里看到我的作品、文章，以及我对 AI 编程和独立开发的一些实践。",
] as const;

export const AboutPage = () => (
  <section className="pb-16 pt-10 md:pt-14">
    <div className="border-b border-[#e5e5e5] pb-10">
      <h1 className="text-[32px] font-semibold leading-10 tracking-normal text-[#171717] md:text-[40px] md:leading-[48px]">
        关于我
      </h1>
    </div>

    <div className="grid gap-6 pt-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <article className="rounded-lg border border-[#e5e5e5] bg-white p-6 md:p-8">
        <div className="max-w-3xl space-y-5 text-base leading-8 tracking-normal text-[#404040]">
          {aboutParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>

      <aside className="rounded-lg border border-[#e5e5e5] bg-white p-6">
        <h2 className="text-[22px] font-semibold leading-8 tracking-normal text-[#171717]">
          联系方式
        </h2>

        <dl className="mt-5 space-y-4 text-sm leading-6 tracking-normal">
          <div>
            <dt className="font-medium text-[#171717]">GitHub:</dt>
            <dd className="mt-1 break-all text-[#525252]">
              https://github.com/zhangrunhao
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[#171717]">Email:</dt>
            <dd className="mt-1 break-all text-[#525252]">
              runhaozhang.dev@gmail.com
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={EMAIL_LINK}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#009966] px-4 text-sm font-medium tracking-normal text-white transition-colors hover:bg-[#00885c]"
          >
            <MailIcon />
            Email
          </Link>
          <Link
            to={GITHUB_LINK}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d4d4d4] bg-white px-4 text-sm font-medium tracking-normal text-[#404040] transition-colors hover:border-[#171717] hover:text-[#171717]"
          >
            <GitHubIcon />
            GitHub
            <ExternalIcon />
          </Link>
        </div>
      </aside>
    </div>
  </section>
);
