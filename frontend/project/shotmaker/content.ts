export const APP_NAME = "ShotMarker";
export const CONTACT_EMAIL = "zhangrhweb@gmail.com";
export const SUPPORT_PATH = "/shotmaker/support";
export const PRIVACY_PATH = "/shotmaker/privacy";
export const EFFECTIVE_DATE = "May 17, 2026";
export const LAST_UPDATED = "2026-05-17";
export const DEVELOPER = "Rain / ShotMarker";

export type ContentBlock =
  | { kind: "paragraph"; text: string; className?: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | {
      kind: "email";
      text: string;
      email: string;
      prefix?: string;
      suffix?: string;
      className?: string;
    }
  | {
      kind: "internalLink";
      text: string;
      href: string;
      label: string;
      prefix: string;
      suffix?: string;
      className?: string;
    };

export type ContentSection = {
  id: string;
  title: string;
  blocks: ContentBlock[];
};

export type ShotMarkerPage = {
  title: string;
  description: string;
  muted?: string;
  summary?: string;
  summaryZh?: string;
  sections: ContentSection[];
};

export const privacyPage: ShotMarkerPage = {
  title: "ShotMarker Privacy Policy",
  description: "Privacy Policy for ShotMarker.",
  muted: `Effective date: ${EFFECTIVE_DATE}`,
  summary:
    "ShotMarker is designed as a local-first training tool. The current version does not require an account, does not show ads, does not use third-party analytics SDKs, and does not upload your videos or training records to the developer's server.",
  summaryZh:
    "ShotMarker 是一个本地优先的训练工具。当前版本不需要账号，不展示广告，不使用第三方分析 SDK，也不会把你的视频或训练记录上传到开发者服务器。",
  sections: [
    {
      id: "scope",
      title: "What This Policy Covers",
      blocks: [
        {
          kind: "paragraph",
          text: "This policy explains how the current version of ShotMarker processes training markers, selected videos, HealthKit workout permission, WatchConnectivity sync data, and diagnostic logs.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "本政策说明当前版本的 ShotMarker 如何处理训练打点、用户选择的视频、HealthKit 训练权限、WatchConnectivity 同步数据和诊断日志。",
        },
      ],
    },
    {
      id: "data",
      title: "Data Processed by ShotMarker",
      blocks: [
        { kind: "heading", text: "Training Session Data" },
        {
          kind: "paragraph",
          text: "ShotMarker may process training start time, training end time, Apple Watch marker timestamps, marker count, and local training session IDs. This data is used to show training sessions on iPhone, match marker times with training videos, and generate highlight clips.",
        },
        {
          kind: "paragraph",
          text: "ShotMarker stores training sessions and marker timestamps locally on your iPhone. When you use the Apple Watch app, completed training sessions are transferred from your Apple Watch to your paired iPhone using Apple's WatchConnectivity framework.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 可能会处理训练开始时间、结束时间、Apple Watch 打点时间、打点数量和本地训练记录 ID。这些数据用于在 iPhone 首页展示训练记录、匹配训练视频时间并生成集锦。使用 Apple Watch App 时，已完成的训练记录会通过 Apple 的 WatchConnectivity 框架在你的 Apple Watch 和配对 iPhone 之间同步。",
        },
        { kind: "heading", text: "Photos and Videos" },
        {
          kind: "paragraph",
          text: "ShotMarker only accesses videos that you explicitly select. The app reads video metadata such as creation time and duration, and uses the selected video content, video track, and audio track to generate highlight clips locally on your device. Your videos are not uploaded to the developer's server.",
        },
        {
          kind: "paragraph",
          text: "ShotMarker may request Photos access to read selected training videos and may request add-only Photos permission to save generated highlight clips to your photo library.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 只访问你主动选择的视频。App 会读取视频拍摄时间、视频时长、视频轨道和音频轨道等信息，并在你的设备本地生成集锦。你的视频不会上传到开发者服务器。ShotMarker 可能会请求照片读取权限以读取所选训练视频，也可能会请求仅添加照片权限以保存生成的集锦。",
        },
        { kind: "heading", text: "HealthKit and Workout Data" },
        {
          kind: "paragraph",
          text: "On Apple Watch, ShotMarker may request HealthKit workout permission to manage a workout session during training. This is used to improve the reliability of training-time marker recording on Apple Watch. ShotMarker does not upload HealthKit data to the developer's server.",
        },
        {
          kind: "paragraph",
          text: "Workout data may be stored in Apple Health according to your Health permissions and Apple system settings.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "在 Apple Watch 上，ShotMarker 可能会请求 HealthKit 训练相关权限，用于在训练期间维持 workout session，提高打点记录的可靠性。ShotMarker 不会把 HealthKit 数据上传到开发者服务器。Workout 数据可能会根据你的健康权限和 Apple 系统设置存储在 Apple Health 中。",
        },
        { kind: "heading", text: "WatchConnectivity" },
        {
          kind: "paragraph",
          text: "ShotMarker uses Apple's WatchConnectivity framework to transfer completed training session data between your own Apple Watch and paired iPhone. This sync is used to show Watch-recorded training markers in the iPhone app.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 使用 Apple 的 WatchConnectivity 框架在你的 Apple Watch 和配对 iPhone 之间同步已完成的训练记录，用于在 iPhone App 中展示 Watch 记录的训练打点。",
        },
        { kind: "heading", text: "Diagnostic Logs" },
        {
          kind: "paragraph",
          text: "ShotMarker stores diagnostic logs locally on your iPhone to help troubleshoot issues such as Watch sync, video loading, highlight generation, and saving to Photos. Logs may include app launch events, sync status, video loading and export status, Photos save errors, app version, build number, device model, system version, error information, and local training session IDs.",
        },
        {
          kind: "paragraph",
          text: "Diagnostic logs are kept locally with a limited rolling retention policy. In the current version, local diagnostic logs are rotated by time and total size. The developer can only access these logs if you choose to export and share them.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 会在 iPhone 本地保存诊断日志，用于排查 Watch 同步、视频读取、集锦生成和相册保存等问题。日志可能包含 App 启动事件、同步状态、视频读取和导出状态、相册保存错误、App 版本、build 号、设备型号、系统版本、错误信息和本地训练记录 ID。诊断日志使用本地滚动保留策略；只有你主动导出并分享时，开发者才会看到这些日志。",
        },
      ],
    },
    {
      id: "not-used",
      title: "What ShotMarker Does Not Do in the Current Version",
      blocks: [
        {
          kind: "list",
          items: [
            "ShotMarker does not require user accounts.",
            "ShotMarker does not upload your videos to the developer's server.",
            "ShotMarker does not upload your training records to the developer's server.",
            "ShotMarker does not sell personal data.",
            "ShotMarker does not use advertising tracking.",
            "ShotMarker does not use third-party analytics SDKs in the current version.",
          ],
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "当前版本的 ShotMarker 不需要用户账号，不会把你的视频或训练记录上传到开发者服务器，不出售个人数据，不使用广告跟踪，也不使用第三方分析 SDK。",
        },
      ],
    },
    {
      id: "retention",
      title: "Data Retention and Deletion",
      blocks: [
        {
          kind: "paragraph",
          text: "Training sessions, clip settings, Watch sync outbox data, and diagnostic logs are stored mainly on your devices. You can delete this local data by deleting ShotMarker from your iPhone and Apple Watch. Diagnostic logs are automatically rotated and removed according to the app's local retention policy.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "训练记录、剪辑设置、Watch 同步 outbox 和诊断日志主要保存在你的设备本地。你可以通过删除 iPhone 和 Apple Watch 上的 ShotMarker 来删除这些本地数据。诊断日志会根据 App 的本地保留策略自动滚动和删除。",
        },
      ],
    },
    {
      id: "permissions",
      title: "Permissions",
      blocks: [
        {
          kind: "paragraph",
          text: "You can manage Photos permissions in the iOS Settings app. You can manage Health permissions in iOS Settings or in the Apple Health app.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "你可以在 iOS 设置中管理照片权限，也可以在 iOS 设置或 Apple Health App 中管理健康权限。",
        },
      ],
    },
    {
      id: "sharing",
      title: "Third-Party Sharing",
      blocks: [
        {
          kind: "paragraph",
          text: "ShotMarker does not share your personal data with third-party advertisers or analytics providers. If you choose to export diagnostic logs and send them to the developer, the logs will be used only to troubleshoot your support request.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 不会向广告商或第三方分析服务共享你的个人数据。如果你主动导出诊断日志并发送给开发者，这些日志只会用于处理你的支持请求。",
        },
      ],
    },
    {
      id: "children",
      title: "Children's Privacy",
      blocks: [
        { kind: "paragraph", text: "ShotMarker is not specifically directed to children." },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 并非专门面向儿童设计。",
        },
      ],
    },
    {
      id: "updates",
      title: "Policy Updates",
      blocks: [
        {
          kind: "paragraph",
          text: "This Privacy Policy may be updated when ShotMarker's features or data practices change. The updated version will be posted on this page with a new effective date.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "如果 ShotMarker 的功能或数据实践发生变化，本隐私政策可能会更新。更新后的版本会发布在本页面，并标明新的生效日期。",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        {
          kind: "email",
          text: `If you have questions about this Privacy Policy or need support, contact ${CONTACT_EMAIL}.`,
          prefix: "If you have questions about this Privacy Policy or need support, contact ",
          email: CONTACT_EMAIL,
          suffix: ".",
        },
        {
          kind: "internalLink",
          text: `Support page: ${SUPPORT_PATH}`,
          prefix: "Support page: ",
          label: SUPPORT_PATH,
          href: SUPPORT_PATH,
        },
        {
          kind: "email",
          className: "language-block",
          text: `如果你对本隐私政策有疑问或需要支持，请联系 ${CONTACT_EMAIL}。支持页面：${SUPPORT_PATH}`,
          prefix: "如果你对本隐私政策有疑问或需要支持，请联系 ",
          email: CONTACT_EMAIL,
          suffix: `。支持页面：${SUPPORT_PATH}`,
        },
      ],
    },
  ],
};

export const supportPage: ShotMarkerPage = {
  title: "ShotMarker Support",
  description: "Support information and FAQ for ShotMarker.",
  muted: "ShotMarker 支持",
  summary:
    "ShotMarker is a basketball training helper app. It lets you mark moments on Apple Watch during training, sync those markers to iPhone, select training videos, and generate highlight clips.",
  summaryZh:
    "ShotMarker 是一个篮球训练辅助 App。你可以在 Apple Watch 上训练打点，结束后同步到 iPhone，选择对应训练视频，并自动生成集锦。",
  sections: [
    {
      id: "contact",
      title: "Contact",
      blocks: [
        {
          kind: "paragraph",
          text: "For help, bug reports, feature requests, or App Store support questions, contact:",
        },
        { kind: "email", className: "contact", text: CONTACT_EMAIL, email: CONTACT_EMAIL },
        {
          kind: "paragraph",
          className: "language-block",
          text: "如需帮助、反馈问题或提出功能建议，请发送邮件到上方邮箱。",
        },
      ],
    },
    {
      id: "faq",
      title: "FAQ",
      blocks: [
        { kind: "heading", text: "1. Apple Watch markers did not sync to iPhone. What should I do?" },
        {
          kind: "list",
          items: [
            "Make sure your Apple Watch and iPhone are paired.",
            "Make sure ShotMarker is installed on both devices.",
            "Open ShotMarker on iPhone, then reopen the Watch app.",
            "Keep the two devices close to each other.",
            "If the issue continues, export diagnostic logs from the iPhone app home screen and email them to support.",
          ],
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "如果 Apple Watch 打点没有同步到 iPhone，请确认手表和手机已配对、两个设备都安装了 ShotMarker，并保持距离较近。仍无法同步时，可以在 iPhone App 首页导出诊断日志后通过邮件联系开发者。",
        },
        { kind: "heading", text: "2. Why did the selected video not match any markers?" },
        {
          kind: "list",
          items: [
            "ShotMarker matches markers by comparing the video recording time with the Apple Watch marker times.",
            "The selected video must cover the time when the training markers happened.",
            "If the video is missing recording time metadata, ShotMarker may not be able to generate a highlight.",
            "Using videos recorded with the iPhone Camera app is recommended.",
          ],
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 会根据视频拍摄时间和 Watch 打点时间进行匹配。视频需要覆盖打点发生的时间；如果视频缺少拍摄时间信息，可能无法生成集锦。建议使用 iPhone 原相机录制的视频。",
        },
        { kind: "heading", text: "3. Why did iCloud video loading fail?" },
        {
          kind: "paragraph",
          text: "If a video only exists in iCloud, iOS may need to download the original video before ShotMarker can read it. Open the video in the Photos app first, confirm that it can play fully, then return to ShotMarker and try again.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "如果视频只存在 iCloud 中，系统可能需要先下载原视频。请先在照片 App 中打开该视频并确认可以完整播放，然后回到 ShotMarker 再试。",
        },
        { kind: "heading", text: "4. Why did saving the highlight clip fail?" },
        {
          kind: "list",
          items: [
            "Make sure ShotMarker is allowed to add content to your photo library.",
            "You can review Photos permissions in iOS Settings.",
            "Make sure your device has enough free storage.",
          ],
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "如果保存集锦失败，请确认已经允许 ShotMarker 添加内容到照片图库，并确认设备存储空间充足。你也可以在 iOS 设置中重新检查照片权限。",
        },
        { kind: "heading", text: "5. Does ShotMarker upload my videos?" },
        {
          kind: "paragraph",
          text: "No. In the current version, ShotMarker reads only the videos you select and uses them locally on your device to generate highlight clips. Your videos are not uploaded to the developer's server.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "不会。当前版本只在设备本地读取你主动选择的视频，用于生成集锦；视频不会上传到开发者服务器。",
        },
        { kind: "heading", text: "6. How do I export diagnostic logs?" },
        {
          kind: "list",
          items: [
            "Open ShotMarker on iPhone.",
            "Tap the export button in the top-right corner of the home screen.",
            "Diagnostic logs can help troubleshoot Watch sync, video loading, highlight generation, and saving to Photos.",
            "The developer can only see these logs if you choose to share them.",
          ],
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "在 iPhone App 首页点击右上角导出按钮即可导出诊断日志。诊断日志可帮助排查同步、视频读取、集锦生成和相册保存问题；只有你主动分享时，开发者才会看到这些日志。",
        },
        { kind: "heading", text: "7. How should I report a problem or suggestion?" },
        {
          kind: "email",
          text: `Email ${CONTACT_EMAIL}. If possible, include your app version, iPhone model, Apple Watch model, iOS version, watchOS version, screenshots, and diagnostic logs.`,
          prefix: "Email ",
          email: CONTACT_EMAIL,
          suffix:
            ". If possible, include your app version, iPhone model, Apple Watch model, iOS version, watchOS version, screenshots, and diagnostic logs.",
        },
        {
          kind: "email",
          className: "language-block",
          text: `请发送邮件到 ${CONTACT_EMAIL}。建议附上 App 版本、iPhone 型号、Apple Watch 型号、iOS/watchOS 版本、问题截图和诊断日志。`,
          prefix: "请发送邮件到 ",
          email: CONTACT_EMAIL,
          suffix: "。建议附上 App 版本、iPhone 型号、Apple Watch 型号、iOS/watchOS 版本、问题截图和诊断日志。",
        },
      ],
    },
    {
      id: "privacy-link",
      title: "Privacy",
      blocks: [
        {
          kind: "internalLink",
          text: `Read the ShotMarker privacy policy at ${PRIVACY_PATH}.`,
          prefix: "Read the ShotMarker privacy policy at ",
          label: PRIVACY_PATH,
          href: PRIVACY_PATH,
          suffix: ".",
        },
        {
          kind: "internalLink",
          className: "language-block",
          text: `你可以在 ${PRIVACY_PATH} 查看 ShotMarker 隐私政策。`,
          prefix: "你可以在 ",
          label: PRIVACY_PATH,
          href: PRIVACY_PATH,
          suffix: " 查看 ShotMarker 隐私政策。",
        },
      ],
    },
  ],
};
