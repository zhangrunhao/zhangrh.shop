# Track 接收配置示例

[track-nginx.conf](track-nginx.conf) 是脱敏整合示例，不是可直接替换现有站点的完整生产配置。它保留 Nginx 追加 JSONL、Backend 只读查询的架构。

## 整合位置

1. 将 `log_format track_json escape=json` 与 `map` 放入现有 `http {}`；名称如有冲突需同时改对应引用。
2. 将示例的三个精确 `location` 合并到现有 HTTPS `server {}`。已有 `/api/` 转发能覆盖新路径时可继续复用；不要添加第二个重复的 location。示例的 `listen 8080`、`server_name localhost`、回环上游和路径仅用于展示层级，不能覆盖现有 TLS、主机和上游配置。
3. `/track` 使用独立 `access_log`，替代该 location 继承的通用访问日志；检查未另配第二个日志目标。持久记录仅包含示例的 11 个字符串字段，不包含 IP、User-Agent、完整请求 URL、Referer 或 Cookie。错误日志也应按既有隐私边界审查，不能把请求 URL 另行持久化。
4. 保持原单一 `events.jsonl` 路径、追加权限和 Backend 只读挂载。不要清空、转换或回填历史四字段行。非 ShotMarker 网页请求的扩展值为空，查询按旧记录处理。
5. `escape=json` 保证引号、控制字符不会破坏 JSONL。字段的语义校验仍由 Backend 完成；非法扩展不能计入正式来源。客户端仅发送固定枚举和数字/UUID，不能发送自由文本错误。

## 发布顺序与验收

本 Change 不授权部署；获得发布授权后，先发布兼容新旧行的 Backend，再整合 Nginx 接收配置，随后更新 Analytics 静态页面，最后发布新版 iPhone。旧客户端无需同步更新。若只部署 Backend，旧 Nginx 仍会丢弃新字段，因此步骤统计暂时为空。

启用配置前，在配置所在环境执行 `nginx -t`，确认访问路径、文件权限、上游与只读挂载；成功后再按该环境的正常程序 reload。文件达到 32 MiB 时需重新评估存储，查询仍有 64 MiB、32 KiB/行、20 秒和共享单查询限制。

只在本地接收端验收固定受控请求，核对 JSONL 字段、旧网页兼容、非法字段不参与聚合、趋势与步骤筛选一致。不得把本地样例发送到生产 `/track`。真实 Release/TestFlight 的渠道分类及生产接收仍需独立验收。

## 本地样例

在仓库根目录使用 Node.js 24：

```sh
node backend/tools/track-sample.mjs
TRACK_LOG_DIR=/tmp/shotmarker-track-sample PORT=3001 node backend/server.js
# 另一个终端
npm --prefix frontend run dev analytics -- --host 127.0.0.1
```

样例脚本只创建新的临时目录，并输出实际目录；将 `TRACK_LOG_DIR` 换成该目录。Vite 的现有 `/api` 代理指向本机 3001。浏览器选 ShotMarker 后默认“正式使用”，可切换测试、自用、未知和全部；版本输入 `1.3` 后按 Enter 应用。开始/成功、失败、取消、忽略、未知、缺开始、冲突及附属诊断均有示例。样例只用虚构安装/操作标识，页面和 API 不返回它们。
