export function BottomTabBar({ activeTab, tabs, onTabChange }) {
  return (
    <nav className="bottom-tabs" aria-label="하단 탭">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <Icon size={21} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
