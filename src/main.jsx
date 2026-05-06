import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarDays, Home, ShoppingBasket } from 'lucide-react';
import { AppHeader } from './components/AppHeader';
import { BottomTabBar } from './components/BottomTabBar';
import { CalendarStrip } from './components/CalendarStrip';
import { MonthlyMealCalendar } from './components/MonthlyMealCalendar';
import { ShoppingList } from './components/ShoppingList';
import { TodayMealCard } from './components/TodayMealCard';
import { appConfig } from './config/appConfig';
import { monthlyShoppingLists } from './data/monthlyShoppingLists';
import { shoppingLists } from './data/shoppingLists';
import { formatIsoDate, getCurrentWeekDates, getTodayTitle } from './utils/date';
import { getCurrentMonthKey } from './utils/monthAccess';
import {
  buildMonthlyPlanFromFallback,
  buildScreenPlanFromMonthlyPlan,
  generateMonthlyHomeMealPlanFromSchoolMeals,
  getManualMonthlyMealPlan,
  getPlanGenerationVersion,
} from './utils/mealTransform';
import { fetchSchoolMealsByMonth } from './utils/neisApi';
import {
  getCachedMonthlyMealPlan,
  getCachedSchoolMeals,
  getShoppingChecks,
  saveLastGeneratedDate,
  isCacheFresh,
  saveCachedMonthlyMealPlan,
  saveCachedSchoolMeals,
  saveShoppingChecks,
} from './utils/storage';
import './styles.css';

const tabs = [
  { id: 'home', label: appConfig.tabs.home, icon: Home },
  { id: 'week', label: appConfig.tabs.weekly, icon: CalendarDays },
  { id: 'shopping', label: appConfig.tabs.shopping, icon: ShoppingBasket },
];

function getDateValue(isoDate) {
  return Date.parse(`${isoDate}T00:00:00`);
}

function isFirstShoppingGroup(groupId = '', list = {}) {
  return list.label?.includes('1차') || /-A$/.test(groupId);
}

function getFallbackShoppingList(groupId, monthlyList) {
  if (monthlyList) return monthlyList;
  return isFirstShoppingGroup(groupId, monthlyList) ? shoppingLists[1] : shoppingLists[2];
}

function buildShoppingGroups(monthlyPlan, monthKey) {
  const monthlyLists = monthlyShoppingLists[monthKey] || {};
  const groupIds = [
    ...new Set([
      ...Object.keys(monthlyLists),
      ...(monthlyPlan.meals || []).map((meal) => meal.shoppingGroup).filter(Boolean),
    ]),
  ].sort((a, b) => {
    const firstMealA = monthlyPlan.meals.find((meal) => meal.shoppingGroup === a);
    const firstMealB = monthlyPlan.meals.find((meal) => meal.shoppingGroup === b);
    return getDateValue(firstMealA?.date || '9999-12-31') - getDateValue(firstMealB?.date || '9999-12-31');
  });

  return groupIds.map((groupId) => {
    const meals = (monthlyPlan.meals || [])
      .filter((meal) => meal.shoppingGroup === groupId && meal.group !== 'free')
      .sort((a, b) => a.date.localeCompare(b.date));
    const monthlyList = monthlyLists[groupId];
    const fallbackList = getFallbackShoppingList(groupId, monthlyList);
    const firstMeal = meals[0];
    const lastMeal = meals[meals.length - 1];
    const period =
      monthlyList?.period ||
      (meals.length > 0 ? meals.map((meal) => `${meal.dateLabel} ${meal.day}`).join(' · ') : fallbackList.period);
    const rangeLabel =
      firstMeal && lastMeal ? `${firstMeal.dateLabel}~${lastMeal.dateLabel}` : period;

    return {
      id: groupId,
      label: monthlyList?.label || fallbackList.label,
      period,
      rangeLabel,
      meals,
      list: {
        ...fallbackList,
        ...monthlyList,
        period,
        storageKey: groupId,
        categories: monthlyList?.categories || fallbackList.categories,
      },
    };
  });
}

function findInitialShoppingGroup(groups, todayIso) {
  if (groups.length === 0) return null;

  const todayValue = getDateValue(todayIso);
  const todayGroup = groups.find((group) => {
    if (group.meals.length === 0) return false;
    const firstValue = getDateValue(group.meals[0].date);
    const lastValue = getDateValue(group.meals[group.meals.length - 1].date);
    return firstValue <= todayValue && todayValue <= lastValue;
  });

  if (todayGroup) return todayGroup;

  return [...groups].sort((a, b) => {
    const aValue = getDateValue(a.meals[0]?.date || '9999-12-31');
    const bValue = getDateValue(b.meals[0]?.date || '9999-12-31');
    return Math.abs(aValue - todayValue) - Math.abs(bValue - todayValue);
  })[0];
}

function hasUsableWeekdayMeals(plan) {
  const hasMeals =
    plan?.coverage === 'monthly' &&
    plan?.meals?.some((meal) => meal.group !== 'free' && meal.menus?.length > 0);

  if (plan?.source === 'manual-reviewed') return hasMeals;

  return hasMeals && plan?.generationVersion === getPlanGenerationVersion();
}

function App() {
  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const monthKey = useMemo(() => getCurrentMonthKey(), []);
  const todayIso = useMemo(() => formatIsoDate(new Date()), []);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedShoppingGroup, setSelectedShoppingGroup] = useState(null);
  const [checkedItems, setCheckedItems] = useState(getShoppingChecks);
  const [status, setStatus] = useState('loading');
  const [monthlyPlan, setMonthlyPlan] = useState(() => {
    const manualPlan = getManualMonthlyMealPlan(monthKey);
    if (manualPlan && hasUsableWeekdayMeals(manualPlan)) return manualPlan;

    const cachedPlan = getCachedMonthlyMealPlan(monthKey);
    if (cachedPlan?.value && hasUsableWeekdayMeals(cachedPlan.value)) return cachedPlan.value;

    return buildMonthlyPlanFromFallback(monthKey);
  });
  const weeklyPlan = useMemo(() => buildScreenPlanFromMonthlyPlan(monthlyPlan, weekDates), [monthlyPlan, weekDates]);
  const shoppingGroups = useMemo(() => buildShoppingGroups(monthlyPlan, monthKey), [monthKey, monthlyPlan]);

  useEffect(() => {
    if (shoppingGroups.length === 0) return;
    if (selectedShoppingGroup && shoppingGroups.some((group) => group.id === selectedShoppingGroup)) return;

    setSelectedShoppingGroup(findInitialShoppingGroup(shoppingGroups, todayIso)?.id || shoppingGroups[0].id);
  }, [selectedShoppingGroup, shoppingGroups, todayIso]);

  useEffect(() => {
    saveShoppingChecks(checkedItems);
  }, [checkedItems]);

  useEffect(() => {
    let ignore = false;

    async function loadMonthlyPlan() {
      const manualPlan = getManualMonthlyMealPlan(monthKey);
      if (manualPlan && hasUsableWeekdayMeals(manualPlan)) {
        setMonthlyPlan(manualPlan);
        setStatus('ready');
        return;
      }

      const cachedPlan = getCachedMonthlyMealPlan(monthKey);
      if (cachedPlan?.value && isCacheFresh(cachedPlan) && hasUsableWeekdayMeals(cachedPlan.value)) {
        setMonthlyPlan(cachedPlan.value);
        setStatus('ready');
        return;
      }

      setStatus('loading');

      try {
        const cachedSchoolMeals = getCachedSchoolMeals(monthKey);
        const schoolMeals =
          cachedSchoolMeals?.value && isCacheFresh(cachedSchoolMeals)
            ? cachedSchoolMeals.value
            : await fetchSchoolMealsByMonth(monthKey);

        if (ignore) return;

        if (!cachedSchoolMeals?.value || !isCacheFresh(cachedSchoolMeals)) {
          saveCachedSchoolMeals(monthKey, schoolMeals);
        }

        const nextPlan = generateMonthlyHomeMealPlanFromSchoolMeals(monthKey, schoolMeals);
        const planToUse = hasUsableWeekdayMeals(nextPlan) ? nextPlan : buildMonthlyPlanFromFallback(monthKey);
        setMonthlyPlan(planToUse);
        saveCachedMonthlyMealPlan(monthKey, planToUse);
        saveLastGeneratedDate(monthKey);
        setStatus('ready');
      } catch {
        if (ignore) return;

        const fallbackPlan = buildMonthlyPlanFromFallback(monthKey);
        setMonthlyPlan(fallbackPlan);
        setStatus('fallback');
      }
    }

    loadMonthlyPlan();

    return () => {
      ignore = true;
    };
  }, [monthKey]);

  const activeShoppingList = useMemo(
    () => shoppingGroups.find((group) => group.id === selectedShoppingGroup) || shoppingGroups[0],
    [selectedShoppingGroup, shoppingGroups],
  );

  const checkedCount = useMemo(() => {
    const items = Object.values(activeShoppingList?.list.categories || {}).flat();
    const done = items.filter((item) => checkedItems[getShoppingItemKey(activeShoppingList.id, item.name)]).length;
    return { done, total: items.length || 1 };
  }, [activeShoppingList, checkedItems]);

  const toggleItem = (key) => {
    setCheckedItems((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <main className="app-shell">
      <section className="phone-frame">
        {activeTab === 'home' && (
          <HomeScreen
            status={status}
            weekDates={weekDates}
            weeklyPlan={weeklyPlan}
          />
        )}
        {activeTab === 'week' && <WeekScreen monthlyPlan={monthlyPlan} />}
        {activeTab === 'shopping' && (
          <ShoppingScreen
            activeShoppingList={activeShoppingList}
            checkedCount={checkedCount}
            checkedItems={checkedItems}
            selectedShoppingGroup={activeShoppingList?.id}
            setSelectedShoppingGroup={setSelectedShoppingGroup}
            shoppingGroups={shoppingGroups}
            toggleItem={toggleItem}
          />
        )}

        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
      </section>
    </main>
  );
}

function getShoppingItemKey(groupId, name) {
  return `shoppingChecks_${groupId}_${name}`;
}

function HomeScreen({ status, weekDates, weeklyPlan }) {
  const todayInfo = weekDates.find((dateInfo) => dateInfo.isToday) || weekDates[0];
  const [selectedDate, setSelectedDate] = useState(todayInfo.iso);
  const selectedMeal = weeklyPlan.days.find((meal) => meal.date === selectedDate) || weeklyPlan.days[0];

  useEffect(() => {
    if (!weeklyPlan.days.some((meal) => meal.date === selectedDate)) {
      setSelectedDate(todayInfo.iso);
    }
  }, [selectedDate, todayInfo.iso, weeklyPlan.days]);

  return (
    <div className="screen">
      <AppHeader title={getTodayTitle()} subtitle={appConfig.weeklySubtitle} />
      <CalendarStrip
        meals={weeklyPlan.days}
        onSelectDate={setSelectedDate}
        selectedDate={selectedDate}
        todayDate={todayInfo.iso}
      />
      <TodayMealCard meal={selectedMeal} status={status} />
    </div>
  );
}

function WeekScreen({ monthlyPlan }) {
  return (
    <div className="screen">
      <MonthlyMealCalendar meals={monthlyPlan.meals} monthKey={monthlyPlan.monthKey} />
    </div>
  );
}

function ShoppingScreen({
  activeShoppingList,
  checkedCount,
  checkedItems,
  selectedShoppingGroup,
  setSelectedShoppingGroup,
  shoppingGroups,
  toggleItem,
}) {
  if (!activeShoppingList) return null;

  return (
    <div className="screen">
      <ShoppingList
        activeShoppingList={activeShoppingList}
        checkedCount={checkedCount}
        checkedItems={checkedItems}
        getItemKey={getShoppingItemKey}
        onGroupChange={setSelectedShoppingGroup}
        selectedShoppingGroup={selectedShoppingGroup}
        shoppingGroups={shoppingGroups}
        toggleItem={toggleItem}
      />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
