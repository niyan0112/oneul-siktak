import { useMemo, useState } from 'react';
import { appConfig } from '../config/appConfig';
import { formatIsoDate } from '../utils/date';
import { cleanMenuName, getMealTitle } from '../utils/mealText';

const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];

function getMonthCells(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);
  const cells = [];

  for (let index = 0; index < firstDate.getDay(); index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function findInitialMeal(meals, todayIso) {
  const todayMeal = meals.find((meal) => meal.date === todayIso);
  if (todayMeal) return todayMeal;

  return [...meals].sort((a, b) => Math.abs(Date.parse(a.date) - Date.parse(todayIso)) - Math.abs(Date.parse(b.date) - Date.parse(todayIso)))[0];
}

export function MonthlyMealCalendar({ meals, monthKey }) {
  const today = new Date();
  const todayIso = formatIsoDate(today);
  const [year, month] = monthKey.split('-').map(Number);
  const monthDate = new Date(year, month - 1, 1);
  const monthTitle = `${year}년 ${month}월`;
  const mealsByDate = useMemo(() => new Map(meals.map((meal) => [meal.date, meal])), [meals]);
  const cells = useMemo(() => getMonthCells(monthDate), [monthDate]);
  const initialMeal = findInitialMeal(meals, todayIso);
  const [selectedDate, setSelectedDate] = useState(initialMeal?.date || todayIso);
  const selectedMeal = mealsByDate.get(selectedDate) || initialMeal;

  return (
    <>
      <div className="month-title-row">
        <strong>{monthTitle}</strong>
        <span>{appConfig.labels.monthlyCalendarSubtitle}</span>
      </div>

      <section className="month-calendar" aria-label="월간 식단 캘린더">
        {dayHeaders.map((day) => (
          <div className="month-day-header" key={day}>
            {day}
          </div>
        ))}
        {cells.map((date, index) => {
          if (!date) return <div className="month-cell empty" key={`empty-${index}`} />;

          const iso = formatIsoDate(date);
          const meal = mealsByDate.get(iso);
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDate;

          return (
            <button
              className={`month-cell ${meal?.group || ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              disabled={!meal}
              key={iso}
              onClick={() => meal && setSelectedDate(iso)}
              type="button"
            >
              <span className="month-date-number">{date.getDate()}</span>
              {meal && <b>{getMealTitle(meal)}</b>}
            </button>
          );
        })}
      </section>

      {selectedMeal && (
        <section className={`calendar-detail-card ${selectedMeal.group}`}>
          <div className="meal-top">
            <div>
              <strong>
                {selectedMeal.dateLabel} {selectedMeal.day}요일
              </strong>
              <p>{getMealTitle(selectedMeal)}</p>
            </div>
            <span className={`meal-tag ${selectedMeal.group}`}>{selectedMeal.tag}</span>
          </div>
          <ul className="menu-list compact">
            {selectedMeal.menus.map((menu, index) => (
              <li key={`${menu}-${index}`}>{cleanMenuName(menu)}</li>
            ))}
          </ul>
          {selectedMeal.cookingTime && (
            <div className="meal-time">
              {appConfig.labels.cookingTime} {selectedMeal.cookingTime}
            </div>
          )}
          {selectedMeal.sourceLabel && <p className="source-note">{selectedMeal.sourceLabel}</p>}
        </section>
      )}
    </>
  );
}
