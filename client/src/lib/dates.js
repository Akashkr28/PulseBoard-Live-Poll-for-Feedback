export function formatDate(value) {
  if (!value) return "Not yet";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function toDateTimeInput(value) {
  const date = value ? new Date(value) : new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function currentInputValue() {
  return toDateTimeInput(new Date());
}

export function tomorrowInputValue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateTimeInput(date);
}
