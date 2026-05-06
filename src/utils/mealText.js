import { menuNameRules } from '../config/mealRules';

export function cleanMenuName(menuName = '') {
  let cleaned = String(menuName);

  menuNameRules.replacements.forEach(({ from, to }) => {
    cleaned = cleaned.split(from).join(to);
  });

  menuNameRules.bannedWords.forEach((word) => {
    cleaned = cleaned.split(word).join('');
  });

  return cleaned
    .replace(/국국/g, '국')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanMenuList(menus = []) {
  return menus.map(cleanMenuName).filter(Boolean);
}

export function getMealTitle(meal) {
  if (meal.shortTitle) return cleanMenuName(meal.shortTitle);

  const menus = cleanMenuList(meal.menus || []);
  if (menus.length > 0) {
    return menus.slice(0, 2).join(' + ');
  }

  return cleanMenuName(meal.mealName || '오늘의 식단');
}
