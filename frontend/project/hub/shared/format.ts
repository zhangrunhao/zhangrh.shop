export const formatDateMonthDay = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const formatDateYmd = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

export const formatDateFull = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

export const sortByDateDesc = <T,>(items: T[], getDate: (item: T) => string) => {
  return [...items].sort(
    (a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime(),
  );
};
