import { useState } from 'react'

type SurveyStep = 'q1' | 'q2' | 'thanks'
type SurveyReason = 'not_understand_rules' | 'too_slow' | 'too_fast' | 'not_rich_content' | 'other'

type SurveyModalProps = {
  isOpen: boolean
  onClose: () => void
}

const CONTACT_EMAIL = 'runhaozhang.dev@gmail.com'
const CONTACT_GITHUB = 'https://github.com/zhangrunhao'

const SURVEY_REASONS: Array<{ value: SurveyReason; label: string }> = [
  { value: 'not_understand_rules', label: '不理解规则' },
  { value: 'too_slow', label: '节奏太慢' },
  { value: 'too_fast', label: '节奏太快' },
  { value: 'not_rich_content', label: '内容不丰富' },
  { value: 'other', label: '其他' },
]

export const SurveyModal = ({ isOpen, onClose }: SurveyModalProps) => {
  const [surveyStep, setSurveyStep] = useState<SurveyStep>('q1')
  const [surveyReason, setSurveyReason] = useState<SurveyReason | null>(null)
  const [surveyOtherText, setSurveyOtherText] = useState('')

  const handleSurveyQ1 = (willing: boolean) => {
    setSurveyStep(willing ? 'thanks' : 'q2')
  }

  const handleSurveySubmit = () => {
    if (!surveyReason) {
      return
    }
    if (surveyReason === 'other' && !surveyOtherText.trim()) {
      return
    }
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="survey-modal-backdrop">
      <div className="survey-modal">
        <div className="survey-modal-head">
          <h3>问卷反馈</h3>
          <button className="survey-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        {surveyStep === 'q1' && (
          <div className="survey-content">
            <p className="survey-question">Q1: 你是否愿意再玩一局？</p>
            <div className="survey-actions">
              <button className="primary-button" onClick={() => handleSurveyQ1(true)} type="button">
                愿意
              </button>
              <button className="survey-inline-button" onClick={() => handleSurveyQ1(false)} type="button">
                不愿意
              </button>
            </div>
          </div>
        )}

        {surveyStep === 'q2' && (
          <div className="survey-content">
            <p className="survey-question">Q2: 不愿意再玩一局的原因</p>
            <div className="survey-option-list">
              {SURVEY_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  className={`survey-option ${surveyReason === reason.value ? 'active' : ''}`}
                  onClick={() => setSurveyReason(reason.value)}
                  type="button"
                >
                  {reason.label}
                </button>
              ))}
            </div>

            {surveyReason === 'other' && (
              <textarea
                className="survey-textarea"
                value={surveyOtherText}
                onChange={(event) => setSurveyOtherText(event.target.value)}
                placeholder="请输入你的想法"
              />
            )}

            <div className="survey-actions">
              <button className="survey-inline-button" onClick={onClose} type="button">
                取消
              </button>
              <button
                className="primary-button"
                onClick={handleSurveySubmit}
                disabled={!surveyReason || (surveyReason === 'other' && !surveyOtherText.trim())}
                type="button"
              >
                完成
              </button>
            </div>
          </div>
        )}

        {surveyStep === 'thanks' && (
          <div className="survey-content">
            <p className="survey-thanks-title">感谢你的支持</p>
            <p className="survey-thanks-text">感谢反馈，后续你仍可随时通过问卷按钮继续提交意见。</p>
            <p className="survey-thanks-text">
              联系方式：<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
            <p className="survey-thanks-text">
              GitHub：
              <a href={CONTACT_GITHUB} target="_blank" rel="noreferrer">
                {CONTACT_GITHUB}
              </a>
            </p>
            <div className="survey-actions">
              <button className="primary-button" onClick={onClose} type="button">
                我知道了
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
