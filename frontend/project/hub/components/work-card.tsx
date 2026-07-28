import type { Work, WorkStatus } from "../types";
import { ArrowIcon } from "./icons";
import { Link } from "./link";

const statusClassName: Record<WorkStatus, string> = {
  active: "bg-emerald-50 border-emerald-200 text-emerald-700",
  archived: "bg-neutral-100 border-neutral-300 text-neutral-600",
};

export const WorkStatusBadge = ({ status }: { status: WorkStatus }) => (
  <span
    className={`inline-flex h-[22px] items-center rounded-full border px-2 text-xs font-medium ${statusClassName[status]}`}
  >
    {status === "active" ? "Active" : "Archived"}
  </span>
);

export const WorkCard = ({ work }: { work: Work }) => (
  <article className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
    <div className="relative h-[334px] bg-neutral-100">
      <img
        src={work.coverImage}
        alt={work.name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute left-3 top-3">
        <WorkStatusBadge status={work.status} />
      </div>
    </div>

    <div className="space-y-3 px-5 py-5">
      <h3 className="text-[18px] font-semibold leading-[24.75px] tracking-[-0.02em] text-[#171717]">
        {work.name}
      </h3>
      <p className="text-sm leading-6 text-[#525252]">{work.summary}</p>
      <Link
        to={work.link}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#009966]"
      >
        查看作品
        <ArrowIcon />
      </Link>
    </div>
  </article>
);
