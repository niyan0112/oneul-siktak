const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatYmd(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export function formatShortDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function getTodayTitle(date = new Date()) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 오늘의 식탁`;
}

export function getMonday(date = new Date()) {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const day = target.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  target.setDate(target.getDate() + diff);
  return target;
}

export function getCurrentWeekDates(date = new Date()) {
  const monday = getMonday(date);
  const todayIso = formatIsoDate(date);

  return WEEK_LABELS.map((day, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    const iso = formatIsoDate(current);
    const group = index < 3 ? 'first' : index < 6 ? 'second' : 'free';

    return {
      day,
      date: current,
      iso,
      ymd: formatYmd(current),
      dateLabel: formatShortDate(current),
      fullDayLabel: DAY_LABELS[current.getDay()],
      group,
      isToday: iso === todayIso,
    };
  });
}

export function getWeekKey(date = new Date()) {
  return formatIsoDate(getMonday(date));
}
