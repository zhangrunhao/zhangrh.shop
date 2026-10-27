import { FLOW_LABELS, COUNTS, COUNT_LABELS, STAGE_LABELS, REASON_LABELS, EVENT_LABELS, type ShotMarkerSummary } from "./shotmarker-query";

export const ShotMarkerSteps = ({ steps }: { steps: ShotMarkerSummary }) => (
  <section className="steps-summary" aria-label="ShotMarker 流程统计">
    <h2>手机侧流程</h2>
    <p>正式使用表示非自用且已验证为 App Store 分发，不代表已确认的外部真人。旧记录无法还原步骤；未收到结果不等于失败。按所选范围内收到的开始与结果统计，不补猜范围外记录，不推算完成率。</p>
    <div className="steps-table-scroll"><table><thead><tr><th>流程</th>{COUNT_LABELS.map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>
      {steps.flows.map((row) => <tr key={row.flow}><th>{FLOW_LABELS[row.flow]}</th>{COUNTS.map((key) => <td key={key}>{row[key]}</td>)}</tr>)}
    </tbody></table></div>
    <h3>失败与附属诊断</h3>
    <p>回执失败与保存后本地状态错误单独展示，不撤销导入或相册保存成功。涉及安装仅按已收到的尝试去重；缺开始、冲突单列。下表也包含缺开始和冲突操作的错误事件，次数不等于上表失败数。</p>
    {steps.issues.length ? <div className="steps-table-scroll"><table><thead><tr><th>流程</th><th>事件</th><th>阶段</th><th>原因</th><th>次数</th></tr></thead><tbody>
      {steps.issues.map((issue) => <tr key={[issue.flow, issue.event, issue.stage, issue.reason].join(":")}><td>{FLOW_LABELS[issue.flow]}</td><td>{EVENT_LABELS[issue.event]}</td><td>{STAGE_LABELS[issue.stage] || "未知"}</td><td>{REASON_LABELS[issue.reason] || "未知"}</td><td>{issue.count}</td></tr>)}
    </tbody></table></div> : <p>暂无失败或附属诊断。</p>}
  </section>
);
