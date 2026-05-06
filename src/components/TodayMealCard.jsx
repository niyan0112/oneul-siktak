import { CheckCircle2, RefreshCw } from 'lucide-react';
import { appConfig } from '../config/appConfig';
import { cleanMenuName, getMealTitle } from '../utils/mealText';

function getShoppingBadge(meal) {
  if (meal.shoppingGroup === 1) return appConfig.badges.firstShopping;
  if (meal.shoppingGroup === 2) return appConfig.badges.secondShopping;
  if (meal.tag) return meal.tag;
  return appConfig.badges.freeDay;
}

export function TodayMealCard({ meal, status }) {
  return (
    <section className="today-card">
      <div className="section-title">
        <span>{appConfig.labels.todayMeal}</span>
        <span className={`soft-pill ${meal.group === 'second' ? 'second-badge' : meal.group === 'free' ? 'free-badge' : 'api'}`}>
          {getShoppingBadge(meal)}
        </span>
      </div>
      {status === 'loading' && (
        <div className="loading-row">
          <RefreshCw size={18} />
          <span>{appConfig.labels.loadingMealPlan}</span>
        </div>
      )}
      <h2>{getMealTitle(meal)}</h2>
      <ul className="menu-list">
        {meal.menus.map((item, index) => (
          <li key={`${item}-${index}`}>{cleanMenuName(item)}</li>
        ))}
      </ul>
      <div className="time-row">
        <CheckCircle2 size={20} />
        <span>
          {meal.cookingTime
            ? `${appConfig.labels.cookingTime}: ${meal.cookingTime}`
            : appConfig.labels.freeDayMessage}
        </span>
      </div>
      {meal.sourceLabel && <p className="source-note">{meal.sourceLabel}</p>}
    </section>
  );
}
