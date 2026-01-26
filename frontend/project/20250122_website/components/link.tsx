import type { MouseEvent, ReactNode } from "react";
import { withBase } from "../routing";

export const Link = ({
  to,
  children,
  className,
  ariaLabel,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) => {
  const isExternal = to.startsWith("http://") || to.startsWith("https://");
  if (isExternal) {
    return (
      <a
        className={className}
        href={to}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }
  const href = withBase(to);
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (window.location.pathname !== href) {
      window.history.pushState({}, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };
  return (
    <a
      className={className}
      href={href}
      onClick={handleClick}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
};
