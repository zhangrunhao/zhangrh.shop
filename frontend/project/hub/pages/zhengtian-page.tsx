type SidebarItem = {
  label: string;
  active?: boolean;
};

type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

type PaletteItem = {
  label: string;
  note: string;
  color: string;
  bordered?: boolean;
};

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: "全局样式",
    items: [
      { label: "颜色", active: true },
      { label: "字体" },
      { label: "圆角" },
      { label: "hover" },
    ],
  },
  {
    title: "组件",
    items: [
      { label: "按钮" },
      { label: "图标" },
      { label: "头像" },
      { label: "图片" },
      { label: "弹窗" },
      { label: "toast" },
      { label: "动效" },
      { label: "空状态" },
    ],
  },
];

const PALETTE_ITEMS: PaletteItem[] = [
  { label: "红1 #EE2F10", note: "品牌色", color: "#EE2F10", bordered: true },
  {
    label: "灰1 #343536",
    note: "正文文字、主要icon",
    color: "#343536",
    bordered: true,
  },
  {
    label: "灰5 #F7F8FA",
    note: "输入框、转发feed背景等",
    color: "#F7F8FA",
    bordered: true,
  },
  { label: "白1 #FFFFFF", note: "大卡片、列表、弹窗背景等", color: "#FFFFFF", bordered: true },
  { label: "灰2 #707072", note: "次要文字、icon", color: "#707072", bordered: true },
  { label: "灰6 #F3F5F7", note: "页面大背景", color: "#F3F5F7", bordered: true },
  { label: "黑1 #000000", note: "蒙层 加透明度使用", color: "#000000" },
  { label: "灰3 #8C8C8F", note: "辅助信息文字、icon", color: "#8C8C8F", bordered: true },
  { label: "灰7 #E9EAEB", note: "分割线等", color: "#E9EAEB", bordered: true },
  { label: "蓝1 #3D5699", note: "可点击链接、文字等", color: "#3D5699", bordered: true },
  { label: "绿1 #37B800", note: "正确、完成等", color: "#37B800", bordered: true },
  { label: "黄1 #fdd536", note: "辅助色", color: "#FDD536", bordered: true },
];

const Chevron = ({ active = false }: { active?: boolean }) => (
  <svg
    aria-hidden="true"
    className={`size-4 ${active ? "text-[#2f80ed]" : "text-[#333333]"}`}
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      d="M4.5 9.75 8 6.25l3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SidebarSection = ({ title, items }: SidebarGroup) => (
  <section>
    <div className="flex h-[60px] items-center justify-between bg-white px-7">
      <h2
        className={`text-[15px] font-[590] leading-[22px] tracking-[-0.43px] ${
          title === "全局样式" ? "text-[#2f80ed]" : "text-[#333333]"
        }`}
      >
        {title}
      </h2>
      <Chevron active={title === "全局样式"} />
    </div>
    <div className="rounded-[10px] bg-[#f9fafb] p-[2px]">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex h-14 w-full items-center rounded-[8px] px-10 text-left text-[14px] leading-[22px] tracking-[-0.43px] transition-colors ${
            item.active
              ? "bg-[#e1eeff] font-medium text-[#2f80ed]"
              : "text-[#333333] hover:bg-white"
          }`}
        >
          {item.label}
        </div>
      ))}
    </div>
  </section>
);

const PaletteCard = ({ label, note, color, bordered }: PaletteItem) => (
  <article className="w-full max-w-[300px]">
    <div className="flex min-h-[43px] items-center gap-4">
      <div
        className={`h-[43px] w-[86px] shrink-0 ${bordered ? "border border-[#e4e4e4]" : ""}`}
        style={{ backgroundColor: color }}
      />
      <h3 className="text-[16px] font-medium leading-[22px] tracking-[2px] text-[#333333]">
        {label}
      </h3>
    </div>
    <div className="mt-[15px] border-t border-[#e9eaeb] pt-[13px] text-[14px] leading-5 text-[#8c8c8f]">
      {note}
    </div>
  </article>
);

export const ZhengtianPage = () => (
  <div className="min-h-screen bg-white">
    <header className="sticky top-0 z-20 h-[70px] border-b border-white/10 bg-white/90 shadow-[0_4px_8px_rgba(0,0,0,0.06)] backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center px-7 md:px-10">
        <span className="text-[17px] font-[590] leading-[22px] tracking-[-0.43px] text-[#333333]">
          时间线web - 组件库
        </span>
      </div>
    </header>

    <div className="mx-auto grid min-h-[calc(100vh-70px)] w-full max-w-[1440px] gap-10 px-4 pb-16 pt-6 md:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-0 lg:px-0 lg:pb-0 lg:pt-0">
      <aside className="relative lg:border-r lg:border-transparent">
        <div className="hidden lg:block">
          <div className="absolute left-[267px] top-[28px] size-[7px] rotate-45 border border-[#d6dce8] bg-white" />
          <div className="absolute left-[267px] top-[328px] size-[7px] rotate-45 border border-[#d6dce8] bg-white" />
        </div>

        <div className="space-y-4 lg:space-y-0">
          {SIDEBAR_GROUPS.map((group, index) => (
            <div key={group.title} className={index === 0 ? "lg:pt-0" : "lg:pt-0"}>
              <SidebarSection {...group} />
            </div>
          ))}
        </div>
      </aside>

      <main className="px-2 md:px-4 lg:px-10 lg:pt-10">
        <section className="max-w-[1060px]" id="colors">
          <h1 className="text-[20px] font-medium leading-[28px] tracking-[1px] text-[#333333]">
            颜色库
          </h1>
          <p className="mt-4 max-w-[1060px] text-[14px] leading-[26px] text-[#333333]">
            我们对于色彩的态度是克制的。色彩在使用时更多的是基于信息传递、操作引导和交互反馈等目的。在不破坏操作效率，影响信息的清晰传达的这些原则之上，理性的选择颜色色库内已有颜色，保证视觉表达之统一。当然在配图插画以及展示性页面中可以适当打破这一思路。
          </p>

          <div className="mt-9 grid gap-x-10 gap-y-9 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-20 xl:gap-y-11">
            {PALETTE_ITEMS.map((item) => (
              <PaletteCard key={item.label} {...item} />
            ))}
          </div>
        </section>
      </main>
    </div>
  </div>
);
