import { useEffect, useMemo, useState, type ReactNode } from "react";
import dashboardImage from "./assets/webtrace-dashboard.png";
import iconImage from "./assets/icon-128.png";
import {
  APP_NAME,
  CONTACT_EMAIL,
  HOME_PATH,
  LAST_UPDATED,
  PRIVACY_PATH,
  SUPPORT_PATH,
  homeContent,
  privacyPage,
  supportPage,
  type ContentBlock,
  type ContentPage as ContentPageModel,
} from "./content";
import { resolveRoute } from "./shared/route";

const usePathname = () => {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return pathname;
};

const SiteHeader = ({ current }: { current: "home" | "support" | "privacy" | "not-found" }) => (
  <header className="site-header">
    <a className="brand-link" href={HOME_PATH} aria-label="WebTrace 首页">
      <img src={iconImage} alt="" aria-hidden="true" />
      <span>{APP_NAME}</span>
    </a>
    <nav aria-label="WebTrace 页面">
      <a href={HOME_PATH} aria-current={current === "home" ? "page" : undefined}>首页</a>
      <a href={SUPPORT_PATH} aria-current={current === "support" ? "page" : undefined}>支持</a>
      <a href={PRIVACY_PATH} aria-current={current === "privacy" ? "page" : undefined}>隐私</a>
    </nav>
  </header>
);

const SiteFooter = () => (
  <footer className="site-footer">
    <div>
      <strong>{APP_NAME}</strong>
      <span>本地优先的网站时间追踪器</span>
    </div>
    <div className="footer-links">
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      <a href={PRIVACY_PATH}>隐私政策</a>
    </div>
  </footer>
);

const PageShell = ({
  current,
  children,
}: {
  current: "home" | "support" | "privacy" | "not-found";
  children: ReactNode;
}) => (
  <div className="site-shell">
    <SiteHeader current={current} />
    {children}
    <SiteFooter />
  </div>
);

const Block = ({ block }: { block: ContentBlock }) => {
  if (block.kind === "heading") {
    return <h3>{block.text}</h3>;
  }
  if (block.kind === "list") {
    return (
      <ul>
        {block.items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    );
  }
  if (block.kind === "email") {
    return (
      <p className={block.className}>
        {block.prefix}<a href={`mailto:${block.email}`}>{block.email}</a>{block.suffix}
      </p>
    );
  }
  if (block.kind === "internalLink") {
    return (
      <p className={block.className}>
        {block.prefix}<a href={block.href}>{block.label}</a>{block.suffix}
      </p>
    );
  }
  return <p className={block.className}>{block.text}</p>;
};

export const HomePage = () => (
  <PageShell current="home">
    <main className="home-page">
      <section className="hero" aria-labelledby="webtrace-title">
        <div className="hero-copy">
          <p className="eyebrow">{homeContent.eyebrow}</p>
          <h1 id="webtrace-title">{APP_NAME}</h1>
          <p className="hero-headline">{homeContent.headline}</p>
          <p className="hero-lead">{homeContent.lead}</p>
          <div className="hero-actions">
            <a className="primary-link" href={SUPPORT_PATH}>查看使用方法</a>
            <a className="text-link" href={PRIVACY_PATH}>阅读隐私政策 <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <figure className="dashboard-frame">
          <div className="dashboard-toolbar" aria-hidden="true">
            <span /><span /><span />
            <strong>LOCAL / PRIVATE</strong>
          </div>
          <img
            src={dashboardImage}
            alt="WebTrace 分析页，展示合成网站数据和最近 14 天趋势"
          />
          <figcaption>真实扩展界面 · 纯合成演示数据</figcaption>
        </figure>
      </section>

      <section className="privacy-callout" aria-labelledby="privacy-callout-title">
        <div className="privacy-badge" aria-hidden="true">LOCAL<br />ONLY</div>
        <div>
          <p className="section-kicker">Privacy by design</p>
          <h2 id="privacy-callout-title">{homeContent.privacyCallout.title}</h2>
          <p>{homeContent.privacyCallout.text}</p>
        </div>
      </section>

      <section className="content-section" aria-labelledby="steps-title">
        <div className="section-heading">
          <p className="section-kicker">01 / 使用</p>
          <h2 id="steps-title">三步开始记录</h2>
        </div>
        <div className="steps-grid">
          {homeContent.steps.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section measurement-section" aria-labelledby="measurement-title">
        <div className="section-heading">
          <p className="section-kicker">02 / 口径</p>
          <h2 id="measurement-title">只计算真正的进入与观看</h2>
        </div>
        <div className="measurement-grid">
          <article>
            <span className="metric-mark">↗</span>
            <h3>打开次数</h3>
            <p>{homeContent.measurement[0]}</p>
          </article>
          <article>
            <span className="metric-mark">◷</span>
            <h3>有效时长</h3>
            <p>{homeContent.measurement[1]}</p>
          </article>
        </div>
      </section>

      <section className="content-section data-section" aria-labelledby="data-title">
        <div className="section-heading">
          <p className="section-kicker">03 / 数据</p>
          <h2 id="data-title">记录边界清清楚楚</h2>
        </div>
        <div className="data-boundary">
          <article>
            <h3><span aria-hidden="true">＋</span> 记录</h3>
            <ul>{homeContent.dataBoundary.recorded.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article>
            <h3><span aria-hidden="true">−</span> 不记录</h3>
            <ul>{homeContent.dataBoundary.notRecorded.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
        <p className="retention-note">{homeContent.dataBoundary.retention}</p>
      </section>

      <section className="content-section" aria-labelledby="features-title">
        <div className="section-heading">
          <p className="section-kicker">04 / 功能</p>
          <h2 id="features-title">一个安静、专注的分析页</h2>
        </div>
        <div className="feature-grid">
          {homeContent.features.map((feature) => (
            <div key={feature}><span aria-hidden="true">●</span>{feature}</div>
          ))}
        </div>
      </section>

      <section className="content-section related-section" aria-labelledby="related-title">
        <div className="section-heading">
          <p className="section-kicker">05 / 更多</p>
          <h2 id="related-title">需要的说明都在这里</h2>
        </div>
        <div className="related-links">
          {homeContent.relatedLinks.map((link) => (
            <a href={link.href} key={link.href}>
              <span>
                <strong>{link.title}</strong>
                <small>{link.description}</small>
              </span>
              <b aria-hidden="true">↗</b>
            </a>
          ))}
        </div>
      </section>
    </main>
  </PageShell>
);

export const ContentPage = ({ page }: { page: ContentPageModel }) => {
  const isPrivacy = page === privacyPage;
  return (
    <PageShell current={isPrivacy ? "privacy" : "support"}>
      <main className={`content-page ${isPrivacy ? "policy-page" : "support-page"}`}>
        <header className="content-hero">
          <p className="eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p className="content-intro">{page.intro}</p>
          {page.introSecondary ? <p className="language-block">{page.introSecondary}</p> : null}
        </header>
        <div className="content-sections">
          {page.sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id}>
              <h2 id={section.id}>{section.title}</h2>
              <div className="section-body">
                {section.blocks.map((block, index) => (
                  <Block block={block} key={`${section.id}-${index}`} />
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="last-updated">Last updated: {LAST_UPDATED}</p>
      </main>
    </PageShell>
  );
};

export const NotFoundPage = () => (
  <PageShell current="not-found">
    <main className="not-found-page">
      <p className="eyebrow">404 / WebTrace</p>
      <h1>WebTrace 页面不存在</h1>
      <p>这个地址不属于 WebTrace 的公开页面。</p>
      <div className="hero-actions">
        <a className="primary-link" href={HOME_PATH}>返回首页</a>
        <a className="text-link" href={SUPPORT_PATH}>前往支持页</a>
      </div>
    </main>
  </PageShell>
);

export const App = () => {
  const pathname = usePathname();
  const route = useMemo(() => resolveRoute(pathname), [pathname]);

  useEffect(() => {
    const metadata = {
      home: { title: homeContent.title, description: homeContent.description },
      support: { title: supportPage.title, description: supportPage.description },
      privacy: { title: privacyPage.title, description: privacyPage.description },
      "not-found": {
        title: `${APP_NAME} - 页面不存在`,
        description: "请求的 WebTrace 页面不存在。",
      },
    } as const;
    document.title = metadata[route.name].title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", metadata[route.name].description);
  }, [route.name]);

  if (route.name === "home") {
    return <HomePage />;
  }
  if (route.name === "support") {
    return <ContentPage page={supportPage} />;
  }
  if (route.name === "privacy") {
    return <ContentPage page={privacyPage} />;
  }
  return <NotFoundPage />;
};
