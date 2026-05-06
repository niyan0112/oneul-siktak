import { appConfig } from '../config/appConfig';
import { getMealTitle } from '../utils/mealText';

export function ShoppingList({
  activeShoppingList,
  checkedCount,
  checkedItems,
  getItemKey,
  onGroupChange,
  selectedShoppingGroup,
  shoppingGroups,
  toggleItem,
}) {
  const categories = activeShoppingList.list.categories;

  return (
    <>
      <div className="shopping-tabs">
        {shoppingGroups.map((group) => (
          <button
            className={selectedShoppingGroup === group.id ? 'active' : ''}
            key={group.id}
            onClick={() => onGroupChange(group.id)}
            type="button"
          >
            <span>{group.rangeLabel}</span>
            <small>{group.label}</small>
          </button>
        ))}
      </div>

      <section className="serving-note">
        <strong>{activeShoppingList.list.period}</strong>
        <span>
          {activeShoppingList.list.serving} · {activeShoppingList.list.description}
        </span>
      </section>

      {activeShoppingList.meals.length > 0 && (
        <section className="shopping-meal-summary">
          <strong>해당 식단</strong>
          <div>
            {activeShoppingList.meals.map((meal) => (
              <p key={meal.date}>
                <span>
                  {meal.dateLabel} {meal.day}
                </span>
                <b>{getMealTitle(meal)}</b>
              </p>
            ))}
          </div>
        </section>
      )}

      <section className="progress-card">
        <span>{appConfig.labels.shoppingProgress}</span>
        <strong>
          {checkedCount.done}/{checkedCount.total}
        </strong>
        <div className="progress-track">
          <div style={{ width: `${(checkedCount.done / checkedCount.total) * 100}%` }} />
        </div>
      </section>

      <section className="shopping-list">
        {Object.entries(categories).map(([categoryName, items]) => (
          <article className="category-card" key={categoryName}>
            <h2>{categoryName}</h2>
            {items.map((item) => {
              const itemKey = getItemKey(activeShoppingList.id, item.name);
              const checked = Boolean(checkedItems[itemKey]);
              return (
                <label className={`shopping-item ${checked ? 'checked' : ''}`} key={itemKey}>
                  <input checked={checked} onChange={() => toggleItem(itemKey)} type="checkbox" />
                  <span>{item.name}</span>
                  <b>{item.amount || appConfig.labels.neededAmount}</b>
                </label>
              );
            })}
          </article>
        ))}
      </section>
    </>
  );
}
