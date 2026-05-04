import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarDays, CheckCircle2, Home, ListChecks, ShoppingBasket } from 'lucide-react';
import './styles.css';

const weekMeals = [
  {
    day: '월',
    date: '5/4',
    title: '식단 1',
    group: 'first',
    tag: '1차 장보기',
    menu: ['돈육콩비지찌개', '간단 백순대볶음', '양상추 겉절이', '골드키위'],
    time: '55~60분',
  },
  {
    day: '화',
    date: '5/5',
    title: '식단 2',
    group: 'first',
    tag: '1차 장보기',
    menu: ['돼지고기 김치볶음', '계란국', '양배추 샐러드'],
    time: '35~45분',
  },
  {
    day: '수',
    date: '5/6',
    title: '식단 3',
    group: 'first',
    tag: '1차 장보기',
    menu: ['순대국밥 스타일 국물', '양상추 참치비빔밥'],
    time: '30~40분',
  },
  {
    day: '목',
    date: '5/7',
    title: '식단 4',
    group: 'second',
    tag: '2차 장보기',
    menu: ['닭간장조림', '미역국', '오이무침', '바나나'],
    time: '45~55분',
  },
  {
    day: '금',
    date: '5/8',
    title: '식단 5',
    group: 'second',
    tag: '2차 장보기',
    menu: ['참치김치찌개', '야채계란말이', '두부부침'],
    time: '35~45분',
  },
  {
    day: '토',
    date: '5/9',
    title: '식단 6',
    group: 'second',
    tag: '2차 장보기',
    menu: ['돼지고기 숙주볶음', '된장국', '상추겉절이', '과일'],
    time: '35~45분',
  },
  {
    day: '일',
    date: '5/10',
    title: '외식/자유식',
    group: 'free',
    tag: '비워둠',
    menu: ['외식/자유식'],
    time: '',
  },
];

const shoppingLists = {
  first: {
    label: '1차 장보기',
    range: '월·화·수',
    categories: [
      {
        name: '고기/단백질',
        items: [
          ['돼지고기', '400g'],
          ['백순대', '500g'],
          ['계란', '6구'],
          ['참치캔', '1개'],
        ],
      },
      {
        name: '채소',
        items: [
          ['양상추', '1통'],
          ['양배추', '1/4통'],
          ['양파', '2개'],
          ['당근', '1개'],
          ['대파', '1단'],
          ['깻잎', '1봉'],
          ['고추', '2~3개'],
          ['마늘', '100g'],
        ],
      },
      {
        name: '냉장/가공',
        items: [
          ['콩비지', '300~400g'],
          ['김치', '500~700g'],
          ['사골육수', '500ml'],
        ],
      },
      {
        name: '과일/후식',
        items: [['골드키위', '4개']],
      },
      {
        name: '양념류',
        items: [
          ['고춧가루', ''],
          ['간장', ''],
          ['참기름', ''],
          ['들깨가루', ''],
          ['식초', ''],
          ['설탕 또는 올리고당', ''],
          ['소금', ''],
          ['후추', ''],
          ['식용유', ''],
        ],
      },
    ],
  },
  second: {
    label: '2차 장보기',
    range: '목·금·토',
    categories: [
      {
        name: '고기/단백질',
        items: [
          ['닭다리살 또는 닭정육', '500g'],
          ['돼지고기 앞다리살', '300g'],
          ['두부', '1모'],
          ['계란', '6구'],
          ['참치캔', '1개'],
        ],
      },
      {
        name: '채소',
        items: [
          ['오이', '2개'],
          ['양파', '2개'],
          ['대파', '1단'],
          ['숙주', '1봉'],
          ['상추', '1봉'],
          ['마늘', '100g'],
        ],
      },
      {
        name: '냉장/가공',
        items: [
          ['김치', '500g'],
          ['미역', '1봉'],
          ['된장', ''],
          ['사골육수 또는 코인육수', ''],
        ],
      },
      {
        name: '과일/후식',
        items: [
          ['바나나', '1송이'],
          ['제철과일', '2~3개'],
        ],
      },
      {
        name: '양념류',
        items: [
          ['간장', ''],
          ['참기름', ''],
          ['고춧가루', ''],
          ['식초', ''],
          ['설탕 또는 올리고당', ''],
          ['소금', ''],
          ['후추', ''],
          ['식용유', ''],
        ],
      },
    ],
  },
};

const tabs = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'week', label: '이번 주 식단', icon: CalendarDays },
  { id: 'shopping', label: '장보기', icon: ShoppingBasket },
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [shoppingRound, setShoppingRound] = useState('first');
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('today-table-checked') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('today-table-checked', JSON.stringify(checkedItems));
  }, [checkedItems]);

  const checkedCount = useMemo(() => {
    const list = shoppingLists[shoppingRound];
    const total = list.categories.reduce((sum, category) => sum + category.items.length, 0);
    const done = Object.entries(checkedItems).filter(([key, value]) => key.startsWith(shoppingRound) && value).length;
    return { done, total };
  }, [checkedItems, shoppingRound]);

  const toggleItem = (key) => {
    setCheckedItems((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <main className="app-shell">
      <section className="phone-frame">
        {activeTab === 'home' && <HomeScreen setActiveTab={setActiveTab} />}
        {activeTab === 'week' && <WeekScreen />}
        {activeTab === 'shopping' && (
          <ShoppingScreen
            checkedCount={checkedCount}
            checkedItems={checkedItems}
            shoppingRound={shoppingRound}
            setShoppingRound={setShoppingRound}
            toggleItem={toggleItem}
          />
        )}

        <nav className="bottom-tabs" aria-label="하단 탭">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <Icon size={21} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </section>
    </main>
  );
}

function Header({ title, subtitle }) {
  return (
    <header className="screen-header">
      <p className="brand">오늘의 식탁</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}

function HomeScreen({ setActiveTab }) {
  const today = weekMeals[0];

  return (
    <div className="screen">
      <Header title="5월 4일 오늘의 식탁" subtitle="이번 주 식단표 · 장보기 2회" />

      <section className="calendar-strip" aria-label="주간 캘린더">
        {weekMeals.map((meal) => (
          <article className={`calendar-card ${meal.group}`} key={meal.day}>
            <strong>{meal.day}</strong>
            <span>{meal.date}</span>
            <b>{meal.title}</b>
          </article>
        ))}
      </section>

      <section className="today-card">
        <div className="section-title">
          <span>오늘의 식단</span>
          <span className="soft-pill">1차 장보기 재료 사용 중</span>
        </div>
        <h2>{today.menu[0]}</h2>
        <ul className="menu-list">
          {today.menu.slice(1).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="time-row">
          <CheckCircle2 size={20} />
          <span>예상 조리시간: {today.time}</span>
        </div>
      </section>

      <div className="action-grid">
        <button className="primary-action" onClick={() => setActiveTab('week')} type="button">
          <CalendarDays size={20} />
          이번 주 식단 보기
        </button>
        <button className="secondary-action" onClick={() => setActiveTab('shopping')} type="button">
          <ListChecks size={20} />
          장보기 리스트 보기
        </button>
      </div>
    </div>
  );
}

function WeekScreen() {
  return (
    <div className="screen">
      <Header title="이번 주 식단" subtitle="월·화·수 한 번, 목·금·토 한 번 준비해요" />

      <section className="week-list">
        {weekMeals.map((meal) => (
          <article className={`meal-card ${meal.group}`} key={meal.day}>
            <div className="meal-top">
              <div>
                <strong>
                  {meal.day}요일 <span>{meal.date}</span>
                </strong>
                <p>{meal.group === 'free' ? '비워둠' : meal.title}</p>
              </div>
              <span className={`meal-tag ${meal.group}`}>{meal.tag}</span>
            </div>
            <div className="meal-menu">{meal.menu.join(' + ')}</div>
            {meal.time && <div className="meal-time">예상 조리시간 {meal.time}</div>}
          </article>
        ))}
      </section>
    </div>
  );
}

function ShoppingScreen({ checkedCount, checkedItems, shoppingRound, setShoppingRound, toggleItem }) {
  const list = shoppingLists[shoppingRound];

  return (
    <div className="screen">
      <Header title="장보기" subtitle={`${list.range} 식단에 필요한 재료를 체크해요`} />

      <div className="shopping-tabs">
        {Object.entries(shoppingLists).map(([key, value]) => (
          <button
            className={shoppingRound === key ? 'active' : ''}
            key={key}
            onClick={() => setShoppingRound(key)}
            type="button"
          >
            <span>{value.label}</span>
            <small>{value.range}</small>
          </button>
        ))}
      </div>

      <section className="progress-card">
        <span>장보기 진행률</span>
        <strong>
          {checkedCount.done}/{checkedCount.total}
        </strong>
        <div className="progress-track">
          <div style={{ width: `${(checkedCount.done / checkedCount.total) * 100}%` }} />
        </div>
      </section>

      <section className="shopping-list">
        {list.categories.map((category) => (
          <article className="category-card" key={category.name}>
            <h2>{category.name}</h2>
            {category.items.map(([name, amount]) => {
              const itemKey = `${shoppingRound}-${category.name}-${name}`;
              const checked = Boolean(checkedItems[itemKey]);
              return (
                <label className={`shopping-item ${checked ? 'checked' : ''}`} key={itemKey}>
                  <input checked={checked} onChange={() => toggleItem(itemKey)} type="checkbox" />
                  <span>{name}</span>
                  <b>{amount || '필요량'}</b>
                </label>
              );
            })}
          </article>
        ))}
      </section>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
