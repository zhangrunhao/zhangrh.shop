import { useEffect, useMemo, useState } from "react";
import {
  APP_NAME,
  CONTACT_EMAIL,
  DEVELOPER,
  LAST_UPDATED,
  privacyPage,
  supportPage,
  type ContentBlock,
  type ShotMarkerPage,
} from "./content";
import { resolveRoute, withBase } from "./shared/route";

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
      "not-found": `${APP_NAME} - Page Not Found`,
    } as const;
    document.title = titleMap[route.name];
    const description =
      route.name === "privacy" ? privacyPage.description : supportPage.description;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
  }, [route.name]);

  return (
    <>
      {route.name === "support" ? <ContentPage page={supportPage} /> : null}
      {route.name === "privacy" ? <ContentPage page={privacyPage} /> : null}
      {route.name === "not-found" ? <NotFoundPage /> : null}
      <span className="sr-only">Support contact: {CONTACT_EMAIL}</span>
    </>
  );
};
