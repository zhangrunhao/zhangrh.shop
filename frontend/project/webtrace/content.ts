export const APP_NAME = "WebTrace";
export const CONTACT_EMAIL = "zhangrhweb@gmail.com";
export const HOME_PATH = "/webtrace/";
export const SUPPORT_PATH = "/webtrace/support";
export const PRIVACY_PATH = "/webtrace/privacy";
export const ZHANGRH_SHOP_URL = "https://zhangrh.shop/hub/";
export const EFFECTIVE_DATE = "September 3, 2026";
export const LAST_UPDATED = "2026-09-03";

export type ContentBlock =
  | { kind: "paragraph"; text: string; className?: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: readonly string[] }
  | {
      kind: "email";
      prefix: string;
      email: string;
      suffix?: string;
      className?: string;
    }
  | {
      kind: "internalLink";
      prefix: string;
      label: string;
      href: string;
      suffix?: string;
      className?: string;
    };

export type ContentSection = {
  id: string;
  title: string;
  blocks: readonly ContentBlock[];
};

export type ContentPage = {
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  introSecondary?: string;
  sections: readonly ContentSection[];
};

export const homeContent = {
  title: "WebTrace - 网站时间追踪器",
  description: "WebTrace 在本机统计你配置的网站打开次数与有效观看时长，并展示最近 14 天趋势和访问明细。",
  eyebrow: "本地优先的网站时间追踪器",
  headline: "看见时间去了哪里，数据仍留在你的电脑里。",
  lead: "WebTrace 帮你统计主动配置的网站每天打开了多少次、真正查看了多久，并在一个清晰的分析页里呈现最近 14 天趋势。",
  privacyCallout: {
    title: "只记录必要信息，只保存在本机",
    text: "WebTrace 只记录你主动配置的网站名称和可注册主域名、打开时间、结束时间和有效观看时长。这些数据全部仅保存在本机的当前 Chrome 配置文件中；不上传、不出售、不用于广告，也不与第三方共享。",
  },
  steps: [
    {
      title: "添加网站",
      text: "打开“管理网站”，阅读本地数据处理说明，勾选确认，再输入名称、域名或 HTTP/HTTPS 页面地址。",
    },
    {
      title: "正常浏览",
      text: "从其他网站进入已配置网站。新增配置不会追溯当前页面，需要离开并重新进入后才产生首次访问。",
    },
    {
      title: "查看统计",
      text: "点击工具栏图标，查看今日概览、最近 14 天趋势，以及按打开日期归属的逐次访问明细。",
    },
  ],
  measurement: [
    "只有从站外进入目标网站才增加一次打开；刷新、站内跳转、跨子域名跳转和同站子标签继承不会重复计数。",
    "只有目标标签页处于活动状态、Chrome 窗口位于前台且未最小化、页面可见、设备未锁屏时才累计有效观看时长。普通无输入状态不会停止计时。",
  ],
  dataBoundary: {
    recorded: [
      "网站名称和归一化后的可注册主域名",
      "打开时间、结束时间、有效观看区间和计算后的时长",
      "关联网站、访问和当前浏览器会话所需的随机技术标识与恢复 checkpoint",
    ],
    notRecorded: [
      "不保存完整 URL、路径、查询参数、网页标题、网页内容、输入内容或 Cookie",
      "不记录姓名、邮箱、账号、广告标识、精确位置、鼠标移动或键盘输入",
    ],
    retention: "访问记录默认长期保留。你可以按网站永久删除历史；删除历史会保留网站配置并继续统计。卸载扩展会移除 Chrome 为 WebTrace 保存的扩展本地数据。",
  },
  features: [
    "今日打开次数与有效使用时长",
    "固定最近 14 天的两张趋势图",
    "按打开日期查看逐次访问明细",
    "多个网站与长按拖动排序",
    "按网站永久删除访问历史",
    "无需账号、广告或外部服务",
  ],
  relatedLinks: [
    {
      title: "使用支持",
      description: "查看安装、计时口径和常见问题。",
      href: SUPPORT_PATH,
    },
    {
      title: "隐私政策",
      description: "查看完整的数据、权限、保留和删除说明。",
      href: PRIVACY_PATH,
    },
    {
      title: "zhangrh.shop",
      description: "返回 zhangrh.shop 作品主页。",
      href: ZHANGRH_SHOP_URL,
    },
  ],
} as const;

export const supportPage: ContentPage = {
  title: "WebTrace 使用支持",
  description: "WebTrace 安装、网站添加、计时口径、历史删除与常见问题。",
  eyebrow: "Support",
  intro: "WebTrace 不需要账号或网页表单。下面的步骤可以解决大多数安装、记录和统计问题。",
  sections: [
    {
      id: "getting-started",
      title: "开始使用",
      blocks: [
        {
          kind: "list",
          items: [
            "安装并启用扩展后，点击 Chrome 工具栏中的 WebTrace 图标打开分析页。",
            "打开“管理网站”，输入网站名称、域名或 HTTP/HTTPS 页面地址。",
            "阅读数据处理说明并主动勾选确认；未确认时 WebTrace 不会添加网站。",
            "添加后先离开目标网站，再从其他网站重新进入；WebTrace 不会追溯添加前已经打开的页面。",
          ],
        },
      ],
    },
    {
      id: "counting",
      title: "打开次数和有效时长如何计算",
      blocks: [
        {
          kind: "paragraph",
          text: "一次新的站外进入会增加打开次数。刷新、站内页面切换、跨子域名跳转和同站子标签继承属于同一次访问，不会重复计算。",
        },
        {
          kind: "paragraph",
          text: "有效时长仅在目标标签页活动、Chrome 窗口前台且未最小化、页面可见、设备未锁屏时累计。普通无输入状态继续计时；切换标签、最小化窗口、隐藏页面或锁屏会暂停。",
        },
      ],
    },
    {
      id: "reports",
      title: "趋势、明细和网站顺序",
      blocks: [
        {
          kind: "list",
          items: [
            "今日概览始终显示所选网站今天的打开次数和有效观看时长。",
            "两张趋势图固定显示今天及此前 13 个本地日；更早记录仍保存在本机，但当前页面不展示。",
            "访问明细按打开日期归属；跨午夜时长会拆分到趋势中的对应日期。",
            "鼠标长按网站后拖动，或在触摸设备上长按右侧把手，即可调整并保存网站顺序。",
          ],
        },
      ],
    },
    {
      id: "deletion",
      title: "删除历史",
      blocks: [
        {
          kind: "paragraph",
          text: "在“管理网站”中选择“删除历史”并再次确认，会永久删除该网站的全部访问记录且无法撤销。删除历史会保留网站配置并继续统计，下一次有效进入会产生新记录。",
        },
      ],
    },
    {
      id: "troubleshooting",
      title: "常见问题",
      blocks: [
        {
          kind: "list",
          items: [
            "没有首次记录：确认已经离开添加时打开的页面，再从站外重新进入；新增网站不回填旧页面。",
            "时长没有增加：确认目标标签页活动、页面可见、Chrome 位于前台且设备未锁屏。",
            "子域名没有单独次数：同一个可注册主域名及其子域名按同一网站处理，这是预期行为。",
            "修改扩展文件后行为未更新：在 chrome://extensions 重新加载未打包扩展。",
          ],
        },
      ],
    },
    {
      id: "contact",
      title: "联系支持",
      blocks: [
        {
          kind: "email",
          prefix: "仍需帮助，请发送邮件至 ",
          email: CONTACT_EMAIL,
          suffix: "。请勿在邮件中发送密码、Cookie、完整浏览历史或其他敏感数据。邮件由你选择的邮件服务处理，WebTrace 扩展不会自动上传信息。",
        },
        {
          kind: "internalLink",
          prefix: "数据处理详情见 ",
          label: "WebTrace 隐私政策",
          href: PRIVACY_PATH,
          suffix: "。",
        },
      ],
    },
  ],
};

export const privacyPage: ContentPage = {
  title: "WebTrace Privacy Policy / 隐私政策",
  description: "WebTrace 隐私政策：本机数据、用途、保留、删除、不共享与权限说明。",
  eyebrow: `Effective ${EFFECTIVE_DATE} · 生效日期 2026-09-03`,
  intro: "WebTrace is a local-only website time tracker. Its extension data stays in the current Chrome profile on your device and is not sent to the developer, zhangrh.shop, or third parties.",
  introSecondary: "WebTrace 是一个仅在本机处理数据的网站时间追踪器。扩展数据保存在你设备的当前 Chrome 配置文件中，不发送给开发者、zhangrh.shop 或第三方。",
  sections: [
    {
      id: "data-processed",
      title: "1. Data processed / 处理的数据",
      blocks: [
        {
          kind: "paragraph",
          text: "WebTrace processes the website name and registrable domain that you configure; opening time, ending time, active viewing intervals, and duration; random technical identifiers used to associate websites, visits, and the current browser session; and a lightweight recovery checkpoint.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "WebTrace 处理你配置的网站名称和可注册主域名；打开时间、结束时间和有效观看时长及其区间；关联网站、访问和当前浏览器会话所需的随机技术标识；以及轻量恢复 checkpoint。",
        },
        {
          kind: "paragraph",
          text: "To decide when time is active, WebTrace temporarily handles active-tab association, Chrome window focus and minimized state, page visibility, and device lock state. Chrome supplies navigation URLs to the extension; WebTrace parses the hostname in memory for domain matching and does not persist the full URL, path, query, or page title.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "为判断有效时长，WebTrace 会临时处理活动标签页关联、Chrome 窗口前台与最小化状态、页面可见状态和设备锁屏状态。Chrome 会向扩展提供导航 URL；WebTrace 只在内存中解析主机名用于域名匹配，不保存完整 URL、路径、查询参数或网页标题。",
        },
      ],
    },
    {
      id: "data-not-processed",
      title: "2. Data not stored or read / 不保存或读取的内容",
      blocks: [
        {
          kind: "paragraph",
          text: "WebTrace does not store full URLs, paths, query parameters, page titles, website content, form input, passwords, cookies, authentication data, names, email addresses, account identifiers, advertising identifiers, precise location, mouse movement, keystrokes, or ordinary input-idle state. The content script does not read the page DOM.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "WebTrace 不保存完整 URL、路径、查询参数、网页标题、网页内容、输入内容或 Cookie，也不读取密码、认证数据、姓名、邮箱、账号标识、广告标识、精确位置、鼠标移动、键盘输入或普通无输入状态。内容脚本不读取页面 DOM。",
        },
      ],
    },
    {
      id: "purpose",
      title: "3. Purpose / 用途",
      blocks: [
        {
          kind: "paragraph",
          text: "The data is used only to show opening counts and active viewing duration for websites you configure, today's summary, the most recent 14-day trends, per-visit details, site ordering, and crash-safe local recovery.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "这些数据仅用于展示你配置网站的打开次数和有效观看时长、今日概览、最近 14 天趋势、逐次访问明细、网站顺序，以及异常退出后的本地恢复。",
        },
      ],
    },
    {
      id: "storage",
      title: "4. Local storage / 本地存储",
      blocks: [
        {
          kind: "paragraph",
          text: "Website configuration is stored in chrome.storage.local. Current-session tab associations and the recovery checkpoint mirror are stored in chrome.storage.session. Visit records are stored in the extension's IndexedDB database. All are stored only in the current Chrome profile on your device.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "网站配置保存在 chrome.storage.local；当前会话的标签关联和恢复 checkpoint 镜像保存在 chrome.storage.session；访问记录保存在扩展自己的 IndexedDB。以上内容全部仅保存在你设备的当前 Chrome 配置文件中。",
        },
      ],
    },
    {
      id: "retention-deletion",
      title: "5. Retention, deletion, and control / 保留、删除与控制",
      blocks: [
        {
          kind: "paragraph",
          text: "Visit records are retained indefinitely by default and have no automatic expiration. Showing only the most recent 14 days does not delete older records. You can permanently delete visit history for one configured website from Manage Sites; this cannot be undone, but the website configuration remains and tracking continues. Uninstalling WebTrace removes the extension data that Chrome stores for it.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "访问记录默认长期保留，没有自动过期。页面只展示最近 14 天不等于删除更早记录。你可以在“管理网站”中按网站永久删除访问历史；操作不可撤销，但删除历史会保留网站配置并继续统计。卸载 WebTrace 会移除 Chrome 为该扩展保存的本地数据。",
        },
        {
          kind: "paragraph",
          text: "Chrome's extension settings let you disable or uninstall WebTrace and control its site access. Restricting site access can prevent recording on affected websites.",
        },
      ],
    },
    {
      id: "sharing",
      title: "6. No transmission, sale, advertising, or sharing / 不传输、不出售、不用于广告、不共享",
      blocks: [
        {
          kind: "paragraph",
          text: "WebTrace does not upload, sell, use for advertising, or share extension data with the developer or any third party. It has no account system, analytics service, advertising service, developer data server, or cross-device sync. It does not load remotely hosted executable code.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "WebTrace 不上传、不出售、不用于广告，也不与第三方共享扩展数据。扩展没有账号系统、分析服务、广告服务、开发者数据服务器或跨设备同步，也不加载远程可执行代码。",
        },
      ],
    },
    {
      id: "permissions",
      title: "7. Chrome permissions / Chrome 权限",
      blocks: [
        {
          kind: "list",
          items: [
            "idle：只用于判断设备是否锁屏；普通无输入状态不会停止计时，也不会保存输入行为。",
            "storage：在 chrome.storage.local 和 chrome.storage.session 保存网站配置与当前会话恢复信息。",
            "unlimitedStorage：让扩展 IndexedDB 长期保存访问历史，不用于缓存网页内容。",
            "webNavigation：识别进入、离开、刷新、站内和跨子域名导航；完整 URL 只被临时解析，不会持久化。",
            "HTTP/HTTPS host access：在用户可能主动配置的网站上确认页面可见并匹配主机名；内容脚本不读取 DOM、正文、表单或 Cookie。",
          ],
        },
      ],
    },
    {
      id: "limited-use",
      title: "8. Chrome Web Store Limited Use",
      blocks: [
        {
          kind: "paragraph",
          text: "WebTrace's use of user data complies with the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only for the disclosed single purpose, is not transferred outside approved use cases, and is not used for advertising, creditworthiness, or lending.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "WebTrace 对用户数据的使用遵守 Chrome Web Store User Data Policy，包括 Limited Use 要求。数据只用于已经披露的单一用途，不在政策允许范围之外转移，也不用于广告、信用评估或借贷。",
        },
      ],
    },
    {
      id: "children",
      title: "9. Children's privacy / 儿童隐私",
      blocks: [
        {
          kind: "paragraph",
          text: "WebTrace is a general-purpose productivity extension, is not directed to children, and does not request age, identity, or contact information.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "WebTrace 是通用效率工具，不面向儿童，也不要求年龄、身份或联系信息。",
        },
      ],
    },
    {
      id: "changes-contact",
      title: "10. Changes and contact / 变更与联系",
      blocks: [
        {
          kind: "paragraph",
          text: "If WebTrace's data practices change, this policy and the in-extension prominent disclosure will be updated before the changed handling is introduced. An update will not retroactively weaken the description of prior behavior.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "如果 WebTrace 的数据实践发生变化，开发者会在新处理方式实施前更新本政策和扩展内显著告知；更新不会追溯性淡化此前行为。",
        },
        {
          kind: "email",
          prefix: "Questions / 问题联系：",
          email: CONTACT_EMAIL,
        },
        {
          kind: "internalLink",
          prefix: "Product page / 产品主页：",
          label: HOME_PATH,
          href: HOME_PATH,
        },
      ],
    },
  ],
};
