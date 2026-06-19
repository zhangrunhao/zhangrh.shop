import { useEffect, useMemo, useState } from "react";
import {
  APP_NAME,
  CONTACT_EMAIL,
  DEVELOPER,
  howToPage,
  LAST_UPDATED,
  privacyPage,
  supportPage,
  type ContentBlock,
  type ShotMarkerPage,
} from "./content";
import { resolveRoute, withBase } from "./shared/route";
import appleWatchImage from "./assets/how-to/apple-watch-49mm.jpg";
import highlightGenerateImage from "./assets/how-to/iphone-highlight-generate.png";
import highlightReadyImage from "./assets/how-to/iphone-highlight-ready.png";
import trainingRecordsImage from "./assets/how-to/iphone-training-records.png";

const usePathname = () => {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePop = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  return pathname;
};

const EmailLink = ({ email }: { email: string }) => (
  <a href={`mailto:${email}`}>{email}</a>
);

const Block = ({ block }: { block: ContentBlock }) => {
  if (block.kind === "heading") {
    return <h3>{block.text}</h3>;
  }

  if (block.kind === "list") {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.kind === "email") {
    return (
      <p className={block.className}>
        {block.prefix}
        <EmailLink email={block.email} />
        {block.suffix}
      </p>
    );
  }

  if (block.kind === "internalLink") {
    return (
      <p className={block.className}>
        {block.prefix}
        <a href={block.href}>{block.label}</a>
        {block.suffix}
      </p>
    );
  }

  return <p className={block.className}>{block.text}</p>;
};

const ContentPage = ({ page }: { page: ShotMarkerPage }) => (
  <main>
    <header>
      <h1>{page.title}</h1>
      {page.muted ? <p className="muted">{page.muted}</p> : null}
      {page.summary ? <p className="summary">{page.summary}</p> : null}
      {page.summaryZh ? <p className="language-block">{page.summaryZh}</p> : null}
    </header>

    {page.sections.map((section) => (
      <section key={section.id} aria-labelledby={section.id}>
        <h2 id={section.id}>{section.title}</h2>
        {section.blocks.map((block, index) => (
          <Block key={`${section.id}-${index}`} block={block} />
        ))}
      </section>
    ))}

    <footer>
      <p>Last updated: {LAST_UPDATED}</p>
      <p>Developer: {DEVELOPER}</p>
    </footer>
  </main>
);

const HOW_TO_STEPS = howToPage.sections.slice(0, 3);
const HOW_TO_TIPS = howToPage.sections.find((section) => section.id === "tips");

const stepVisuals = [
  {
    className: "how-to-visual single watch-shot",
    images: [{ src: appleWatchImage, alt: "Apple Watch 上的 ShotMarker 训练按钮" }],
  },
  {
    className: "how-to-visual single phone-shot",
    images: [{ src: trainingRecordsImage, alt: "iPhone 上的 ShotMarker 训练记录列表" }],
  },
  {
    className: "how-to-visual pair",
    images: [
      { src: highlightReadyImage, alt: "iPhone 上已选择视频并显示可剪辑打点" },
      { src: highlightGenerateImage, alt: "iPhone 上点击生成集锦的页面" },
    ],
  },
] as const;

const HowToPage = () => (
  <main className="how-to-page">
    <section className="how-to-hero" aria-labelledby="how-to-title">
      <div className="how-to-hero-inner">
        <div className="how-to-copy">
          {howToPage.muted ? <p className="how-to-eyebrow">{howToPage.muted}</p> : null}
          <h1 id="how-to-title">{APP_NAME}</h1>
          {howToPage.summary ? <p>{howToPage.summary}</p> : null}
          <div className="how-to-flow" aria-label="使用流程">
            {HOW_TO_STEPS.map((step) => (
              <span key={step.id}>{step.title.replace(/^用 |^打开 |^选择 /, "")}</span>
            ))}
          </div>
        </div>

        <div className="how-to-device-stage" aria-label="ShotMarker 产品截图">
          <img className="how-to-phone back" src={trainingRecordsImage} alt="iPhone 训练记录列表" />
          <img className="how-to-phone front" src={highlightReadyImage} alt="iPhone 集锦生成页面" />
          <img className="how-to-watch" src={appleWatchImage} alt="Apple Watch 训练打点页面" />
        </div>
      </div>
    </section>

    <section className="how-to-steps" aria-labelledby="how-to-steps-title">
      <div className="how-to-section-title">
        <h2 id="how-to-steps-title">只记住这三步</h2>
        {howToPage.summaryZh ? <p>{howToPage.summaryZh}</p> : null}
      </div>

      {HOW_TO_STEPS.map((step, index) => (
        <article className="how-to-step" key={step.id}>
          <div className="how-to-step-copy">
            <span className="how-to-step-number">{index + 1}</span>
            <h3>{step.title}</h3>
            {step.blocks.map((block, blockIndex) =>
              block.kind === "paragraph" ? <p key={blockIndex}>{block.text}</p> : null,
            )}
          </div>
          <div className={stepVisuals[index].className}>
            {stepVisuals[index].images.map((image) => (
              <img key={image.src} src={image.src} alt={image.alt} />
            ))}
          </div>
        </article>
      ))}
    </section>

    {HOW_TO_TIPS ? (
      <section className="how-to-tips" aria-labelledby="how-to-tips-title">
        <div className="how-to-section-title compact">
          <h2 id="how-to-tips-title">{HOW_TO_TIPS.title}</h2>
        </div>
        <div className="how-to-tip-grid">
          {HOW_TO_TIPS.blocks.flatMap((block) =>
            block.kind === "list"
              ? block.items.map((item) => (
                  <div className="how-to-tip" key={item}>
                    <span>{item}</span>
                  </div>
                ))
              : [],
          )}
        </div>
      </section>
    ) : null}
  </main>
);

const NotFoundPage = () => (
  <main>
    <section>
      <h1>Page not found</h1>
      <p>The requested {APP_NAME} page does not exist.</p>
      <p>
        <a href={withBase("/support")}>Go to support</a>
      </p>
    </section>
  </main>
);

export const App = () => {
  const pathname = usePathname();
  const route = useMemo(() => resolveRoute(pathname), [pathname]);

  useEffect(() => {
    const titleMap = {
      support: supportPage.title,
      privacy: privacyPage.title,
      "how-to": howToPage.title,
      "not-found": `${APP_NAME} - Page Not Found`,
    } as const;
    document.title = titleMap[route.name];
    const description =
      route.name === "privacy"
        ? privacyPage.description
        : route.name === "how-to"
          ? howToPage.description
          : supportPage.description;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
  }, [route.name]);

  return (
    <>
      {route.name === "support" ? <ContentPage page={supportPage} /> : null}
      {route.name === "privacy" ? <ContentPage page={privacyPage} /> : null}
      {route.name === "how-to" ? <HowToPage /> : null}
      {route.name === "not-found" ? <NotFoundPage /> : null}
      <span className="sr-only">Support contact: {CONTACT_EMAIL}</span>
    </>
  );
};
