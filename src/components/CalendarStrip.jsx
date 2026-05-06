import { appConfig } from '../config/appConfig';
import { getMealTitle } from '../utils/mealText';

export function CalendarStrip({ meals, onSelectDate, selectedDate, todayDate }) {
  return (
    <section className="calendar-strip" aria-label="주간 캘린더">
      {meals.map((meal) => (
        <button
          className={`calendar-card ${meal.group} ${meal.date === todayDate ? 'today' : ''} ${
            meal.date === selectedDate ? 'selected' : ''
          }`}
          key={meal.date}
          onClick={() => onSelectDate(meal.date)}
          type="button"
        >
          <strong>{meal.day}</strong>
          <span>{meal.dateLabel}</span>
          <b>{meal.group === 'free' ? appConfig.badges.freeDay : getMealTitle(meal)}</b>
        </button>
      ))}
    </section>
  );
}
