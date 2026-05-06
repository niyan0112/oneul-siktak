import { fallbackSchoolMeals } from '../data/fallbackSchoolMeals';
import { mealPlans } from '../data/mealPlans';
import { monthlyMealPlans } from '../data/monthlyMealPlans';
import { shoppingLists } from '../data/shoppingLists';
import { mealPlanningRules } from '../config/mealRules';
import { formatIsoDate, formatShortDate, getWeekKey } from './date';
import { cleanMenuList, cleanMenuName } from './mealText';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const SOURCE_LABEL = '';
const PLAN_GENERATION_VERSION = 'weekly-candidate-v3-rules';

const LOW_VALUE_KEYWORDS = [
  '밥',
  '백미밥',
  '현미밥',
  '잡곡밥',
  '김치',
  '깍두기',
  '배추김치',
  '우유',
  '음료',
  '주스',
  '요구르트',
  '과일',
  '바나나',
  '키위',
  '떡',
  '빵',
  '쿠키',
  '케이크',
  '아이스크림',
];

const GOOD_KEYWORDS = [
  '찌개',
  '국',
  '볶음',
  '조림',
  '구이',
  '무침',
  '계란',
  '두부',
  '닭',
  '돼지',
  '돈육',
  '소고기',
  '생선',
  '오징어',
  '샐러드',
  '나물',
];

const HARD_KEYWORDS = ['튀김', '전', '갈비찜', '잡채', '탕수육', '돈가스', '돈까스', '스테이크', '리조또', '파스타'];

function includesAny(value, keywords) {
  return keywords.some((keyword) => value.includes(keyword));
}

function normalizeMenuName(menu = '') {
  return menu.replace(/\s/g, '').replace(/[^가-힣a-zA-Z]/g, '');
}

function isSimilarMenu(a = '', b = '') {
  const left = normalizeMenuName(a);
  const right = normalizeMenuName(b);
  if (!left || !right) return false;
  return left.includes(right) || right.includes(left) || left.slice(0, 3) === right.slice(0, 3);
}

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function parseDishName(dishName = '') {
  return decodeHtml(dishName)
    .split(/<br\s*\/?>/i)
    .map((menu) =>
      menu
        .replace(/<[^>]*>/g, ' ')
        .replace(/\([^가-힣a-zA-Z)]*\d[\d.,\s]*[^가-힣a-zA-Z)]*\)/g, '')
        .replace(/\[[^\]]*\d[^\]]*\]/g, '')
        .replace(/\d+(\.\d+)*/g, '')
        .replace(/[★☆●◆◇◎ㆍ·]/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean);
}

function homeStyleMenu(menu) {
  return menu
    .replace(/매운갈비찜/g, '매운돼지볶음')
    .replace(/갈비찜/g, '간장돼지불고기')
    .replace(/잡채/g, '계란말이')
    .replace(/돈가스|돈까스/g, '돼지고기구이')
    .replace(/탕수육/g, '돼지고기구이')
    .replace(/스테이크/g, '고기구이')
    .replace(/리조또|파스타/g, '볶음밥')
    .replace(/튀김/g, '구이')
    .replace(/생선조림/g, '생선구이')
    .replace(/샐러드/g, '겉절이')
    .replace(/나물무침/g, '간단 나물무침')
    .replace(/전$/g, '계란부침');
}

function scoreMenu(menu) {
  let score = 1;
  if (includesAny(menu, LOW_VALUE_KEYWORDS)) score -= 5;
  if (includesAny(menu, GOOD_KEYWORDS)) score += 5;
  if (includesAny(menu, HARD_KEYWORDS)) score -= 2;
  return score;
}

function getSourceMenus(schoolMeal) {
  return schoolMeal?.menus || parseDishName(schoolMeal?.dishName || schoolMeal?.DDISH_NM || '');
}

function selectHomeMenus(menus) {
  const transformed = menus
    .map(homeStyleMenu)
    .map(cleanMenuName)
    .filter((menu) => !includesAny(menu, ['밥', '우유', '음료', '주스', '요구르트', '쿠키', '케이크', '아이스크림']))
    .sort((a, b) => scoreMenu(b) - scoreMenu(a));

  const goodMenus = transformed.filter((menu) => scoreMenu(menu) > 0 && !includesAny(menu, ['김치', '깍두기']));
  return [...new Set(goodMenus)].slice(0, 4);
}

function getMainMenuFromMenus(menus) {
  return [...menus].sort((a, b) => scoreMenu(b) - scoreMenu(a))[0] || '';
}

export function transformSchoolMealToHomeMeal(schoolMeal) {
  const sourceMenus = getSourceMenus(schoolMeal);
  const menus = selectHomeMenus(sourceMenus);
  const safeMenus = cleanMenuList(menus.length > 0 ? menus : ['간단 계란국', '두부부침', '겉절이']);
  const hasHardMenu = safeMenus.some((menu) => includesAny(menu, HARD_KEYWORDS));

  return {
    shortTitle: safeMenus.slice(0, 2).join(' + '),
    menus: safeMenus,
    cookingTime: hasHardMenu ? '55~60분' : safeMenus.length >= 3 ? '45~60분' : '30~45분',
    sourceLabel: SOURCE_LABEL,
    mainMenu: getMainMenuFromMenus(safeMenus),
  };
}

function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return `${year}년 ${month}월`;
}

function getDateFromIso(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function inferMealGroup(meal) {
  if (meal.group) return meal.group;
  if (!meal.shoppingGroup || meal.shoppingLabel?.includes('자유식') || meal.shoppingLabel?.includes('외식')) return 'free';
  if (meal.shoppingLabel?.includes('1차') || /-A$/.test(meal.shoppingGroup)) return 'first';
  if (meal.shoppingLabel?.includes('2차') || /-B$/.test(meal.shoppingGroup)) return 'second';

  const date = getDateFromIso(meal.date);
  return getGroupClass(date);
}

function normalizeManualMeal(meal, manualPlan) {
  const date = getDateFromIso(meal.date);
  const group = inferMealGroup(meal);
  const shoppingLabel = meal.shoppingLabel || getShoppingLabel(date);
  const tag = meal.tag || shoppingLabel;

  return {
    ...meal,
    sourceLabel: '',
    group,
    day: meal.day || DAY_LABELS[date.getDay()],
    dateLabel: meal.dateLabel || formatShortDate(date),
    shoppingLabel,
    tag,
  };
}

export function getManualMonthlyMealPlan(monthKey) {
  const manualPlan = monthlyMealPlans[monthKey];
  if (!manualPlan?.meals?.length) return null;

  return {
    monthKey,
    monthLabel: manualPlan.monthLabel || getMonthLabel(monthKey),
    coverage: 'monthly',
    source: 'manual-reviewed',
    sourceLabel: '',
    updatedAt: manualPlan.updatedAt || new Date().toISOString().slice(0, 10),
    meals: manualPlan.meals.map((meal) => normalizeManualMeal(meal, manualPlan)),
  };
}

function getDatesInMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const lastDate = new Date(year, month, 0).getDate();
  return Array.from({ length: lastDate }, (_, index) => new Date(year, month - 1, index + 1));
}

export function splitMonthIntoWeeks(monthKey) {
  const dates = getDatesInMonth(monthKey);
  const weeks = [];
  let currentWeek = null;

  dates.forEach((date) => {
    if (!currentWeek || date.getDay() === 1) {
      currentWeek = {
        weekIndex: weeks.length + 1,
        dates: [],
      };
      weeks.push(currentWeek);
    }
    currentWeek.dates.push(date);
  });

  return weeks;
}

function getShoppingGroupForWeek(monthKey, weekIndex, groupCode) {
  return `${monthKey}-W${weekIndex}-${groupCode}`;
}

function getGroupClass(date) {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) return 'free';
  return dayOfWeek >= 1 && dayOfWeek <= 3 ? 'first' : 'second';
}

function getShoppingLabel(date) {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) return '외식/자유식';
  return dayOfWeek >= 1 && dayOfWeek <= 3 ? '1차 장보기' : '2차 장보기';
}

function makeFreeMeal(date) {
  const iso = formatIsoDate(date);
  return {
    id: iso,
    date: iso,
    day: DAY_LABELS[date.getDay()],
    dateLabel: formatShortDate(date),
    group: 'free',
    shortTitle: '외식/자유식',
    mealName: '외식/자유식',
    menus: ['외식/자유식'],
    cookingTime: '',
    shoppingGroup: null,
    shoppingLabel: '외식/자유식',
    tag: '외식/자유식',
    sourceLabel: '월 1회 업데이트',
  };
}

function scoreSchoolMeal(schoolMeal, usedMainMenus) {
  const sourceMenus = getSourceMenus(schoolMeal);
  const homeMenus = selectHomeMenus(sourceMenus);
  if (homeMenus.length === 0) return -100;

  const mainMenu = getMainMenuFromMenus(homeMenus);
  let score = homeMenus.reduce((sum, menu) => sum + scoreMenu(menu), 0);
  if (schoolMeal.mealType?.includes('석식')) score += 4;
  if (usedMainMenus.has(normalizeMenuName(mainMenu))) score -= 20;
  for (const used of usedMainMenus) {
    if (isSimilarMenu(mainMenu, used)) score -= 12;
  }

  return score;
}

export function selectWeeklySchoolMealCandidates(weekSchoolMeals, usedMainMenus) {
  const ranked = weekSchoolMeals
    .map((meal) => ({
      meal,
      homeMeal: transformSchoolMealToHomeMeal(meal),
      score: scoreSchoolMeal(meal, usedMainMenus),
    }))
    .filter((item) => item.score > -50 && item.homeMeal.mainMenu)
    .sort((a, b) => b.score - a.score);

  const first = ranked[0];
  const second = ranked.find((item) => item.meal.id !== first?.meal.id && !isSimilarMenu(item.homeMeal.mainMenu, first?.homeMeal.mainMenu));

  return {
    firstBlockCandidate: first?.meal || null,
    secondBlockCandidate: second?.meal || ranked[1]?.meal || null,
  };
}

function inferProteinName(menus) {
  const joined = menus.join(' ');
  if (/오징어/.test(joined)) return '오징어';
  if (/소고기|쇠고기/.test(joined)) return '소고기';
  if (/닭/.test(joined)) return '닭고기';
  if (/생선/.test(joined)) return '생선';
  if (/두부/.test(joined)) return '두부';
  if (/순대/.test(joined)) return '순대';
  return '돼지고기';
}

function createDerivedMenus(baseMenus, dayOffset) {
  const protein = inferProteinName(baseMenus);
  const hasSoup = baseMenus.some((menu) => /국|찌개|탕|개장/.test(menu));
  const hasLeaf = baseMenus.some((menu) => /샐러드|겉절이|상추|양상추/.test(menu));

  if (protein === '오징어') {
    return dayOffset === 1
      ? ['오징어 채소볶음', hasSoup ? '계란국' : '콩나물국', '오이무침']
      : ['오징어덮밥', hasLeaf ? '상추겉절이' : '무생채'];
  }
  if (protein === '소고기') {
    return dayOffset === 1
      ? ['소고기버섯볶음', '두부부침', '오이무침']
      : ['소고기무국', '계란말이', hasLeaf ? '겉절이' : '시금치나물'];
  }
  if (protein === '닭고기') {
    return dayOffset === 1
      ? ['닭고기 간장덮밥', '계란국', '오이무침']
      : ['닭개장', '두부부침', hasLeaf ? '상추겉절이' : '콩나물무침'];
  }
  if (protein === '생선') {
    return dayOffset === 1
      ? ['생선구이', '무생채', '된장국']
      : ['생선살 계란부침', '오이무침', '두부된장국'];
  }
  if (protein === '두부') {
    return dayOffset === 1
      ? ['두부조림', '계란국', '양배추무침']
      : ['참치두부찌개', '야채계란말이'];
  }
  if (protein === '순대') {
    return dayOffset === 1
      ? ['순대국밥', '양상추 참치비빔밥']
      : ['돼지고기 김치볶음', '계란국', '양배추 샐러드'];
  }

  return dayOffset === 1
    ? ['돼지고기 채소볶음', hasSoup ? '계란국' : '된장국', '양배추무침']
    : ['돼지고기 숙주볶음', hasLeaf ? '상추겉절이' : '오이무침', '두부부침'];
}

function isSoupMenu(menu = '') {
  return mealPlanningRules.soupRules.keywords.some((keyword) => menu.includes(keyword));
}

function getPrimarySoup(menus) {
  return menus.find(isSoupMenu);
}

function applySoupPlacementRules(dayMenus) {
  const cleanedDays = dayMenus.map(cleanMenuList);
  const { soupRules, repetitionRules } = mealPlanningRules;

  if (!soupRules.canRepeatConsecutively || !repetitionRules.allowSameSoupForTwoDays) {
    return cleanedDays;
  }

  const primarySoup = getPrimarySoup(cleanedDays[0]) || getPrimarySoup(cleanedDays[1]);
  if (!primarySoup) return cleanedDays;

  return cleanedDays.map((menus, index) => {
    const withoutOtherSoups = menus.filter((menu) => !isSoupMenu(menu) || menu === primarySoup);
    const withoutPrimarySoup = withoutOtherSoups.filter((menu) => menu !== primarySoup);

    if (index < soupRules.maxConsecutiveDays) {
      return cleanMenuList([primarySoup, ...withoutPrimarySoup]).slice(0, 4);
    }

    return cleanMenuList(withoutPrimarySoup).slice(0, 4);
  });
}

function makeMealFromBlock(date, baseMeal, menus, shoppingGroup, dayIndex) {
  const iso = formatIsoDate(date);
  const cleanedMenus = cleanMenuList(menus);
  return {
    id: iso,
    date: iso,
    day: DAY_LABELS[date.getDay()],
    dateLabel: formatShortDate(date),
    group: getGroupClass(date),
    mealName: '급식 기반 집밥',
    shortTitle: cleanedMenus.slice(0, 2).join(' + '),
    menus: cleanedMenus,
    cookingTime: dayIndex === 0 ? baseMeal.cookingTime : dayIndex === 1 ? '35~45분' : '30~40분',
    shoppingGroup,
    shoppingLabel: getShoppingLabel(date),
    tag: getShoppingLabel(date),
    sourceLabel: SOURCE_LABEL,
  };
}

export function createThreeDayHomeMealBlock(candidate, dates, shoppingGroup, usedMainMenus) {
  if (!candidate || dates.length === 0) return [];

  const baseMeal = transformSchoolMealToHomeMeal(candidate);
  usedMainMenus.add(normalizeMenuName(baseMeal.mainMenu));

  const dayMenus = dates.map((_, index) => (index === 0 ? baseMeal.menus : createDerivedMenus(baseMeal.menus, index)));
  const plannedMenus = applySoupPlacementRules(dayMenus);

  return dates.map((date, index) => makeMealFromBlock(date, baseMeal, plannedMenus[index], shoppingGroup, index));
}

function getFallbackMealsForMonth(monthKey) {
  if (fallbackSchoolMeals[monthKey]) return fallbackSchoolMeals[monthKey];

  const staticPlan = monthlyMealPlans[monthKey];
  if (staticPlan?.meals?.length) {
    return staticPlan.meals
      .filter((meal) => meal.group !== 'free')
      .map((meal) => ({
        id: `${meal.date}-fallback`,
        date: meal.date,
        mealType: '석식',
        menus: meal.menus,
      }));
  }

  const candidatePairs = [
    [
      ['돈육콩비지찌개', '백순대볶음', '양상추샐러드'],
      ['닭간장조림', '미역국', '오이무침'],
    ],
    [
      ['오징어볶음', '콩나물국', '참나물무침'],
      ['소고기무국', '두부조림', '시금치나물'],
    ],
    [
      ['돼지고기숙주볶음', '된장국', '상추겉절이'],
      ['닭개장', '야채계란말이', '오이무침'],
    ],
    [
      ['생선구이', '무생채', '감자조림'],
      ['돼지불고기', '시금치나물', '계란국'],
    ],
  ];

  return splitMonthIntoWeeks(monthKey).flatMap((week) => {
    const pair = candidatePairs[(week.weekIndex - 1) % candidatePairs.length];
    const firstBlockDate = getBlockDates(week, 'A')[0];
    const secondBlockDate = getBlockDates(week, 'B')[0];
    return [
      firstBlockDate && {
        id: `${monthKey}-fallback-W${week.weekIndex}-A`,
        date: formatIsoDate(firstBlockDate),
        mealType: '석식',
        menus: pair[0],
      },
      secondBlockDate && {
        id: `${monthKey}-fallback-W${week.weekIndex}-B`,
        date: formatIsoDate(secondBlockDate),
        mealType: '석식',
        menus: pair[1],
      },
    ].filter(Boolean);
  });
}

function getWeekSchoolMeals(schoolMeals, week) {
  const dateSet = new Set(week.dates.map(formatIsoDate));
  return schoolMeals.filter((meal) => dateSet.has(meal.date));
}

function getBlockDates(week, blockCode) {
  const allowedDays = blockCode === 'A' ? [1, 2, 3] : [4, 5, 6];
  return week.dates.filter((date) => allowedDays.includes(date.getDay()));
}

export function generateMonthlyHomeMealPlanFromSchoolMeals(monthKey, schoolMeals = []) {
  const sourceMeals = [...getFallbackMealsForMonth(monthKey), ...schoolMeals];
  const weeks = splitMonthIntoWeeks(monthKey);
  const usedMainMenus = new Set();
  const meals = [];

  weeks.forEach((week) => {
    const weekSchoolMeals = getWeekSchoolMeals(sourceMeals, week);
    const candidates = selectWeeklySchoolMealCandidates(weekSchoolMeals, usedMainMenus);
    const firstBlockDates = getBlockDates(week, 'A');
    const secondBlockDates = getBlockDates(week, 'B');
    const secondBlockCandidate =
      candidates.secondBlockCandidate || (firstBlockDates.length === 0 ? candidates.firstBlockCandidate : null);

    const firstBlockMeals = createThreeDayHomeMealBlock(
      candidates.firstBlockCandidate,
      firstBlockDates,
      getShoppingGroupForWeek(monthKey, week.weekIndex, 'A'),
      usedMainMenus,
    );
    const secondBlockMeals = createThreeDayHomeMealBlock(
      secondBlockCandidate,
      secondBlockDates,
      getShoppingGroupForWeek(monthKey, week.weekIndex, 'B'),
      usedMainMenus,
    );

    meals.push(...firstBlockMeals, ...secondBlockMeals);

    week.dates
      .filter((date) => date.getDay() === 0)
      .forEach((date) => meals.push(makeFreeMeal(date)));
  });

  return {
    monthKey,
    monthLabel: getMonthLabel(monthKey),
    coverage: 'monthly',
    generationVersion: PLAN_GENERATION_VERSION,
    sourceLabel: SOURCE_LABEL,
    updatedAt: new Date().toISOString().slice(0, 10),
    meals: meals.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function buildMonthlyPlanFromFallback(monthKey) {
  return generateMonthlyHomeMealPlanFromSchoolMeals(monthKey, getFallbackMealsForMonth(monthKey));
}

function findMealForDate(monthlyPlan, dateInfo) {
  const meal = monthlyPlan.meals.find((item) => item.date === dateInfo.iso);
  if (meal) return meal;
  if (dateInfo.group === 'free') return makeFreeMeal(dateInfo.date);
  return null;
}

function inferShoppingListFromMenus(meals, fallbackCategories) {
  const joined = meals.flatMap((meal) => meal.menus || []).join(' ');
  const proteins = [];
  if (/닭/.test(joined)) proteins.push({ name: '닭다리살 또는 닭정육', amount: '500g' });
  if (/돼지|돈육|불고기|숙주볶음/.test(joined)) proteins.push({ name: '돼지고기', amount: '400g' });
  if (/소고기|쇠고기/.test(joined)) proteins.push({ name: '소고기', amount: '300g' });
  if (/오징어/.test(joined)) proteins.push({ name: '오징어', amount: '1마리' });
  if (/생선/.test(joined)) proteins.push({ name: '생선살', amount: '400g' });
  if (/두부/.test(joined)) proteins.push({ name: '두부', amount: '1모' });
  if (/계란|달걀|부침|말이/.test(joined)) proteins.push({ name: '계란', amount: '6구' });
  if (proteins.length === 0) proteins.push(...(fallbackCategories['고기/단백질'] || []));

  const vegetables = [
    { name: '양파', amount: '2개' },
    { name: '대파', amount: '1단' },
    { name: '마늘', amount: '100g' },
  ];
  if (/양상추|상추|겉절이|샐러드/.test(joined)) vegetables.push({ name: '상추 또는 양상추', amount: '1봉' });
  if (/오이|무침/.test(joined)) vegetables.push({ name: '오이', amount: '2개' });
  if (/숙주|콩나물|나물/.test(joined)) vegetables.push({ name: '숙주 또는 콩나물', amount: '1봉' });
  if (/양배추/.test(joined)) vegetables.push({ name: '양배추', amount: '1/4통' });

  return {
    '고기/단백질': dedupeItems(proteins),
    채소: dedupeItems(vegetables),
    '냉장/가공': fallbackCategories['냉장/가공'] || [],
    '과일/후식': fallbackCategories['과일/후식'] || [],
    양념류: fallbackCategories.양념류 || [],
  };
}

function dedupeItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

function buildBlocksFromWeekMeals(weekMeals) {
  return [1, 2].map((groupNumber) => {
    const groupClass = groupNumber === 1 ? 'first' : 'second';
    const groupMeals = weekMeals.filter((meal) => meal?.group === groupClass);
    const firstMeal = groupMeals[0];
    const fallbackCategories = shoppingLists[groupNumber].categories;
    return {
      group: groupNumber,
      source: 'monthly',
      sourceSchool: '민족사관고등학교',
      sourceDate: firstMeal?.date || '',
      sourceMealType: '',
      sourceMenus: groupMeals.flatMap((meal) => meal.menus),
      days: groupMeals,
      shoppingList: inferShoppingListFromMenus(groupMeals, fallbackCategories),
    };
  });
}

export function buildScreenPlanFromMonthlyPlan(monthlyPlan, weekDates) {
  const days = weekDates.map((dateInfo) => findMealForDate(monthlyPlan, dateInfo)).filter(Boolean);
  return {
    source: 'monthly',
    reason: 'monthly-neis',
    weekKey: getWeekKey(weekDates[0].date),
    generatedAt: monthlyPlan.updatedAt,
    days,
    blocks: buildBlocksFromWeekMeals(days),
  };
}

export function buildFallbackWeeklyPlan(weekDates, reason = 'fallback') {
  return {
    source: 'fallback',
    reason,
    weekKey: getWeekKey(weekDates[0].date),
    generatedAt: new Date().toISOString(),
    ...buildScreenPlanFromMonthlyPlan(buildMonthlyPlanFromFallback(weekDates[0].iso.slice(0, 7)), weekDates),
  };
}

export function buildWeeklyPlanFromRows(rows, weekDates) {
  const monthKey = weekDates[0].iso.slice(0, 7);
  const monthlyPlan = generateMonthlyHomeMealPlanFromSchoolMeals(monthKey, rows);
  return buildScreenPlanFromMonthlyPlan(monthlyPlan, weekDates);
}

export function getMainMenusFromPlan(plan) {
  return plan?.blocks?.map((block) => block.days?.[0]?.menus?.[0]).filter(Boolean) || [];
}

export function getPlanGenerationVersion() {
  return PLAN_GENERATION_VERSION;
}
