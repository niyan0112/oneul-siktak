import { MealCard } from './MealCard';

export function WeeklyMealList({ meals }) {
  return (
    <section className="week-list">
      {meals.map((meal) => (
        <MealCard key={meal.date} meal={meal} />
      ))}
    </section>
  );
}
