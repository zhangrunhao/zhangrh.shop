const noop = () => {};

const wx = window.wx || {
  config: noop,
  ready(callback) {
    if (typeof callback === "function") callback();
  },
  error: noop,
  onMenuShareTimeline: noop,
  onMenuShareAppMessage: noop,
  updateAppMessageShareData: noop,
  updateTimelineShareData: noop,
};

export default wx;
