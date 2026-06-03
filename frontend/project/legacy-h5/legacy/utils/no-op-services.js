export const bindWX = () => {};

export const eventTracking = () => {};

export const allowSensitiveText = (value) => ({
  allowed: String(value).trim().length > 0,
  reason: String(value).trim().length > 0 ? "" : "empty",
});

export const getLocalUserInfo = () => ({
  id: "legacy-local-user",
  nickName: "本地体验用户",
  headUrl: "",
});

export const saveLocalResult = () => true;
