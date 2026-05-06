const CHECKED_KEY = 'today-table-checked';
const RECENT_KEY = 'recentMainMenus';
const LAST_GENERATED_KEY = 'lastGeneratedDate';
const WEEKLY_PLAN_KEY = 'weeklyMealPlan';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail in private mode. The app should still render.
  }
}

export function loadCheckedItems() {
  return readJson(CHECKED_KEY, {});
}

export function saveCheckedItems(value) {
  writeJson(CHECKED_KEY, value);
}

export function getShoppingChecks() {
  return loadCheckedItems();
}

export function saveShoppingChecks(value) {
  saveCheckedItems(value);
}

export function loadRecentMainMenus() {
  return readJson(RECENT_KEY, []);
}

export function saveRecentMainMenus(menus) {
  writeJson(RECENT_KEY, [...new Set(menus.filter(Boolean))].slice(0, 12));
}

export function loadWeeklyMealPlan() {
  return readJson(WEEKLY_PLAN_KEY, null);
}

export function saveWeeklyMealPlan(plan) {
  writeJson(WEEKLY_PLAN_KEY, plan);
}

export function getWeeklyMealPlan() {
  return loadWeeklyMealPlan();
}

function monthStorageKey(prefix, monthKey) {
  return `${prefix}_${monthKey.replace('-', '_')}`;
}

function readMonthlyCache(prefix, monthKey) {
  const cached = readJson(monthStorageKey(prefix, monthKey), null);
  if (!cached?.value) return null;
  return cached;
}

function writeMonthlyCache(prefix, monthKey, value) {
  writeJson(monthStorageKey(prefix, monthKey), {
    cachedAt: new Date().toISOString(),
    value,
  });
}

export function getCachedSchoolMeals(monthKey) {
  return readMonthlyCache('schoolMeals', monthKey);
}

export function saveCachedSchoolMeals(monthKey, schoolMeals) {
  writeMonthlyCache('schoolMeals', monthKey, schoolMeals);
}

export function getCachedMonthlyMealPlan(monthKey) {
  return readMonthlyCache('monthlyGeneratedMealPlan', monthKey);
}

export function saveCachedMonthlyMealPlan(monthKey, plan) {
  writeMonthlyCache('monthlyGeneratedMealPlan', monthKey, plan);
}

export function isCacheFresh(cacheEntry) {
  if (!cacheEntry?.cachedAt) return false;
  return Date.now() - Date.parse(cacheEntry.cachedAt) < CACHE_MAX_AGE_MS;
}

export function loadLastGeneratedDate() {
  try {
    return localStorage.getItem(LAST_GENERATED_KEY);
  } catch {
    return null;
  }
}

export function saveLastGeneratedDate(weekKey) {
  try {
    localStorage.setItem(LAST_GENERATED_KEY, weekKey);
  } catch {
    // Ignore localStorage failures.
  }
}
