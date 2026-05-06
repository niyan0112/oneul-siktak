import { appConfig } from '../config/appConfig';

export function ShoppingList({
  activeShoppingList,
  checkedCount,
  checkedItems,
  getItemKey,
  onRoundChange,
  shoppingRound,
  shoppingRounds,
  toggleItem,
  weeklyPlan,
}) {
  const block = weeklyPlan.blocks[activeShoppingList.blockIndex];
  const categories = activeShoppingList.list.categories;

  return (
    <>
      <div className="shopping-tabs">
        {Object.entries(shoppingRounds).map(([key, value]) => (
          <button
            className={shoppingRound === key ? 'active' : ''}
            key={key}
            onClick={() => onRoundChange(key)}
            type="button"
          >
            <span>{value.list.label}</span>
            <small>{value.list.period}</small>
          </button>
        ))}
      </div>

      <section className="serving-note">
        <strong>{activeShoppingList.list.serving}</strong>
        <span>{activeShoppingList.list.description}</span>
      </section>

      <section className="progress-card">
        <span>{appConfig.labels.shoppingProgress}</span>
        <strong>
          {checkedCount.done}/{checkedCount.total}
        </strong>
        <div className="progress-track">
          <div style={{ width: `${(checkedCount.done / checkedCount.total) * 100}%` }} />
        </div>
        {block?.sourceSchool && (
          <p className="source-note">{block.source === 'api' ? '민사고 급식 기반 재료' : '기본 장보기 재료'}</p>
        )}
      </section>

      <section className="shopping-list">
        {Object.entries(categories).map(([categoryName, items]) => (
          <article className="category-card" key={categoryName}>
            <h2>{categoryName}</h2>
            {items.map((item) => {
              const itemKey = getItemKey(activeShoppingList.list.storageKey || shoppingRound, item.name);
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
