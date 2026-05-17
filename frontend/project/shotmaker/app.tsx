import { useEffect, useMemo, useState } from "react";
import { resolveRoute, withBase } from "./shared/route";

const supportItems = [
  "App Store support URL endpoint",
  "Contact and troubleshooting content placeholder",
  "Privacy policy cross-link placeholder",
];

const privacyItems = [
  "App Store privacy policy URL endpoint",
  "Data collection summary placeholder",
  "Data deletion and contact placeholder",
];

const usePathname = () => {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePop = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  return pathname;
};

const NavLink = ({
  active,
  children,
  to,
}: {
  active: boolean;
  children: string;
  to: string;
}) => (
  <a className={active ? "nav-link active" : "nav-link"} href={withBase(to)}>
    {children}
  </a>
);

const PlaceholderList = ({ items }: { items: string[] }) => (
  <ul className="placeholder-list">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const SupportPage = () => (
  <section className="panel">
    <p className="eyebrow">Support</p>
    <h1>Shotmaker Support</h1>
    <p className="lede">
      This page is reserved for Shotmaker support information required by App
      Store Connect.
    </p>
    <PlaceholderList items={supportItems} />
  </section>
);

const PrivacyPage = () => (
  <section className="panel">
    <p className="eyebrow">Privacy Policy</p>
    <h1>Shotmaker Privacy Policy</h1>
    <p className="lede">
      This page is reserved for the Shotmaker privacy policy required by App
      Store Connect.
    </p>
    <PlaceholderList items={privacyItems} />
  </section>
);

const NotFoundPage = () => (
  <section className="panel">
    <p className="eyebrow">404</p>
    <h1>Page not found</h1>
    <p className="lede">The requested Shotmaker page does not exist.</p>
    <a className="primary-link" href={withBase("/support")}>
      Go to support
    </a>
  </section>
);

export const App = () => {
  const pathname = usePathname();
  const route = useMemo(() => resolveRoute(pathname), [pathname]);

  useEffect(() => {
    const titleMap = {
      support: "Shotmaker Support",
      privacy: "Shotmaker Privacy Policy",
      "not-found": "Shotmaker - Page Not Found",
    } as const;
    document.title = titleMap[route.name];
  }, [route.name]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href={withBase("/support")} aria-label="Shotmaker">
          <span className="brand-mark">S</span>
          <span>Shotmaker</span>
        </a>
        <nav className="site-nav" aria-label="Shotmaker pages">
          <NavLink active={route.name === "support"} to="/support">
            Support
          </NavLink>
          <NavLink active={route.name === "privacy"} to="/privacy">
            Privacy
          </NavLink>
        </nav>
      </header>

      <main className="main-content">
        {route.name === "support" ? <SupportPage /> : null}
        {route.name === "privacy" ? <PrivacyPage /> : null}
        {route.name === "not-found" ? <NotFoundPage /> : null}
      </main>
    </div>
  );
};
