export const Loading = ({ progress }: { progress: number }) => (
  <div className="loading-screen">
    <div className="loading-spinner" />
    <div className="loading-text">{Math.round(progress * 100)}%</div>
  </div>
)
