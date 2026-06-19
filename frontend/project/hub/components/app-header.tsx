import { NAV_ITEMS } from "../shared/constants";
import { trackHubClick } from "../shared/tracking";
import type { Route } from "../shared/route";
import { NavIcon } from "./icons";
import { Link } from "./link";

export const AppHeader = ({ routeName }: { routeName: Route["name"] }) => (
  <header className="sticky top-0 z-30 border-b border-[#e5e5e5] bg-white/95 backdrop-blur-sm">
    <div className="mx-auto flex h-16 w-full max-w-[1216px] items-center justify-between">
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded px-1 py-1 text-neutral-900"
        ariaLabel="返回首页"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#009966] text-sm font-bold text-white">
          Z
        </span>
        <span className="text-lg font-medium tracking-normal">zhangrh.shop</span>
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
              onClick={() => trackHubClick(item.button)}
              className={`relative inline-flex h-8 items-center gap-0.5 whitespace-nowrap rounded-lg px-1.5 text-xs font-medium transition-colors sm:gap-1 sm:px-3 sm:text-sm ${
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
