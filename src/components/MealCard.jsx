import { appConfig } from '../config/appConfig';
import { cleanMenuName, getMealTitle } from '../utils/mealText';

export function MealCard({ meal }) {
  return (
    <article className={`meal-card ${meal.group}`}>
      <div className="meal-top">
        <div>
          <strong>
            {meal.day}요일 <span>{meal.dateLabel}</span>
          </strong>
          <p>{meal.group === 'free' ? appConfig.badges.empty : meal.mealName || meal.title}</p>
        </div>
        <span className={`meal-tag ${meal.group}`}>{meal.tag}</span>
      </div>
      <div className="meal-menu">{getMealTitle(meal)}</div>
      <div className="meal-detail">{meal.menus.map(cleanMenuName).join(' + ')}</div>
      {meal.cookingTime && <div className="meal-time">{appConfig.labels.cookingTime} {meal.cookingTime}</div>}
      {meal.sourceLabel && <p className="source-note">{meal.sourceLabel}</p>}
    </article>
  );
}
