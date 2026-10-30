import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`flex border-2 border-ink bg-white shadow-[3px_3px_0px_#171717] ${className}`}>
      {tabs.map((tab, idx) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2.5
            font-heading font-bold text-sm transition-all duration-150 cursor-pointer
            ${idx < tabs.length - 1 ? 'border-r-2 border-ink' : ''}
            ${activeTab === tab.id
              ? 'bg-yello text-ink'
              : 'bg-white text-ink/60 hover:bg-yello-pale hover:text-ink'
            }
          `}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.badge !== undefined && (
            <span className="bg-ink text-white text-xs px-1.5 py-0.5 rounded-full font-mono min-w-[20px] text-center">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
