export const CalendarIcon = () => (
  <svg className="size-3" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M7 2V5M17 2V5M4 9H20M6 4H18C19.1046 4 20 4.89543 20 6V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V6C4 4.89543 4.89543 4 6 4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ArrowIcon = ({ className }: { className?: string }) => (
  <svg
    className={className ?? "size-3.5"}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden
  >
    <path
      d="M3.5 8H12.5M12.5 8L9 4.5M12.5 8L9 11.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CubeIcon = () => (
  <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 3L20 7.5L12 12L4 7.5L12 3ZM4 7.5V16.5L12 21V12M20 7.5V16.5L12 21"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MailIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 6.5H20V17.5H4V6.5ZM4 7L12 13L20 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GitHubIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M9 18C5.5 19 5.5 16.5 4 16M14 20V17.5C14 16.4 14.1 16.1 13.5 15.5C16 15.2 18.5 14.2 18.5 10.5C18.5 9.5 18.1 8.6 17.5 7.8C17.7 7.2 17.8 6.2 17.3 5C17.3 5 16.5 4.7 14.5 6.1C13 5.7 11.5 5.7 10 6.1C8 4.7 7.2 5 7.2 5C6.7 6.2 6.8 7.2 7 7.8C6.4 8.6 6 9.5 6 10.5C6 14.2 8.5 15.2 11 15.5C10.4 16.1 10.4 16.7 10.5 17.5V20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ExternalIcon = () => (
  <svg className="size-3" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M10 3H13V6M13 3L8 8M6 4H4.5C3.67157 4 3 4.67157 3 5.5V11.5C3 12.3284 3.67157 13 4.5 13H10.5C11.3284 13 12 12.3284 12 11.5V10"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type NavIconName = "product" | "idea" | "about";

export const NavIcon = ({
  icon,
  active,
}: {
  icon: NavIconName;
  active: boolean;
}) => {
  const className = `size-4 ${active ? "text-[#009966]" : "text-neutral-500"}`;

  if (icon === "product") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3L20 7.5L12 12L4 7.5L12 3ZM4 7.5V16.5L12 21V12M20 7.5V16.5L12 21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "idea") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 18H15M10 21H14M8 14C6.8 13 6 11.5 6 9.8C6 6.6 8.7 4 12 4C15.3 4 18 6.6 18 9.8C18 11.5 17.2 13 16 14C15.3 14.6 15 15.1 15 16H9C9 15.1 8.7 14.6 8 14Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 14C14.2 14 16 12.2 16 10C16 7.8 14.2 6 12 6C9.8 6 8 7.8 8 10C8 12.2 9.8 14 12 14ZM5 20C5.9 17.7 8.6 16 12 16C15.4 16 18.1 17.7 19 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
