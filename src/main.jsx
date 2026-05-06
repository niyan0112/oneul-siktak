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
import { getCurrentWeekDates, getTodayTitle } from './utils/date';
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

const shoppingRounds = {
  first: { group: 1, blockIndex: 0, list: shoppingLists[1] },
  second: { group: 2, blockIndex: 1, list: shoppingLists[2] },
};

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
  const [activeTab, setActiveTab] = useState('home');
  const [shoppingRound, setShoppingRound] = useState('first');
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

  const activeShoppingList = useMemo(() => {
    const round = shoppingRounds[shoppingRound];
    const block = weeklyPlan.blocks[round.blockIndex];
    const groupId = block?.days?.[0]?.shoppingGroup;
    const monthlyShoppingList = monthlyShoppingLists[monthKey]?.[groupId];

    return {
      ...round,
      list: {
        ...(monthlyShoppingList || round.list),
        storageKey: groupId || shoppingRound,
        categories: monthlyShoppingList?.categories || block?.shoppingList || round.list.categories,
      },
    };
  }, [monthKey, shoppingRound, weeklyPlan]);

  const checkedCount = useMemo(() => {
    const items = Object.values(activeShoppingList.list.categories).flat();
    const done = items.filter((item) => checkedItems[getShoppingItemKey(shoppingRound, item.name)]).length;
    return { done, total: items.length || 1 };
  }, [activeShoppingList, checkedItems, shoppingRound]);

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
            shoppingRound={shoppingRound}
            setShoppingRound={setShoppingRound}
            toggleItem={toggleItem}
            weeklyPlan={weeklyPlan}
          />
        )}

        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
      </section>
    </main>
  );
}

function getShoppingItemKey(round, name) {
  return `${round}-${name}`;
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
  shoppingRound,
  setShoppingRound,
  toggleItem,
  weeklyPlan,
}) {
  return (
    <div className="screen">
      <ShoppingList
        activeShoppingList={activeShoppingList}
        checkedCount={checkedCount}
        checkedItems={checkedItems}
        getItemKey={getShoppingItemKey}
        onRoundChange={setShoppingRound}
        shoppingRound={shoppingRound}
        shoppingRounds={shoppingRounds}
        toggleItem={toggleItem}
        weeklyPlan={weeklyPlan}
      />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
