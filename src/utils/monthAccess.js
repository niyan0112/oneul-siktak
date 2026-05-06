const SERVICE_START_MONTH = '2026-05';

function pad(value) {
  return String(value).padStart(2, '0');
}

function parseMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return { year, month };
}

function compareMonthKeys(a, b) {
  return a.localeCompare(b);
}

function addMonths(monthKey, amount) {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function getAvailableMonths(date = new Date()) {
  const currentMonthKey = getCurrentMonthKey(date);
  const startMonthKey = date.getFullYear() >= 2027 ? `${date.getFullYear()}-01` : SERVICE_START_MONTH;
  const months = [];

  let cursor = startMonthKey;
  while (compareMonthKeys(cursor, currentMonthKey) <= 0) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  return months;
}

export function isMonthAvailable(monthKey, date = new Date()) {
  return getAvailableMonths(date).includes(monthKey);
}

export function getPrevAvailableMonth(monthKey, date = new Date()) {
  const months = getAvailableMonths(date);
  const index = months.indexOf(monthKey);
  return index > 0 ? months[index - 1] : null;
}

export function getNextAvailableMonth(monthKey, date = new Date()) {
  const months = getAvailableMonths(date);
  const index = months.indexOf(monthKey);
  return index >= 0 && index < months.length - 1 ? months[index + 1] : null;
}
