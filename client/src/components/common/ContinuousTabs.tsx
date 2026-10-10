import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number | string;
}

export interface ContinuousTabsProps {
  tabs: TabItem[];
  defaultActiveId?: string;
  activeId?: string;
  onChange?: (id: string) => void;
  className?: string;
  size?: 'normal' | 'compact';
}

export const ContinuousTabs: React.FC<ContinuousTabsProps> = ({
  tabs,
  defaultActiveId,
  activeId: controlledActiveId,
  onChange,
  className,
  size = 'normal',
}) => {
  const isControlled = controlledActiveId !== undefined;
  const [internalActiveId, setInternalActiveId] = useState<string>(
    defaultActiveId || (tabs.length > 0 ? tabs[0].id : '')
  );

  const currentActiveId = isControlled ? controlledActiveId : internalActiveId;
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const handleTabClick = (id: string) => {
    if (!isControlled) {
      setInternalActiveId(id);
    }
    onChange?.(id);
  };

  // Ensure active tab scrolls into view on mobile / narrow viewports
  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      const container = containerRef.current;
      const tab = activeTabRef.current;

      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        tab.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [currentActiveId]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      handleTabClick(tabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      handleTabClick(tabs[prevIndex].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (tabs.length > 0) handleTabClick(tabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      if (tabs.length > 0) handleTabClick(tabs[tabs.length - 1].id);
    }
  };

  if (!tabs || tabs.length === 0) return null;

  return (
    <div
      className={clsx(
        'w-full max-w-full overflow-x-auto overflow-y-hidden scrollbar-none py-1',
        className
      )}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        ref={containerRef}
        role="tablist"
        aria-orientation="horizontal"
        className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#F4EFE6] border border-[#D6CFC4] min-w-max shadow-inner"
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === currentActiveId;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : undefined}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={clsx(
                'relative flex items-center justify-center gap-2 font-bold whitespace-nowrap rounded-xl transition-all duration-200 select-none min-h-[44px]',
                size === 'compact'
                  ? 'px-3.5 py-1.5 text-xs sm:text-sm'
                  : 'px-4 sm:px-5 py-2 text-sm sm:text-base',
                isActive
                  ? 'bg-[#8B1A1A] text-white shadow-sm ring-1 ring-[#8B1A1A]/30'
                  : 'text-[#3F3F46] hover:text-[#1A1A1A] hover:bg-white/70 active:bg-white/90'
              )}
            >
              {Icon && (
                <Icon
                  className={clsx(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-[#6B7280]'
                  )}
                  aria-hidden="true"
                />
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    'ml-1 px-2 py-0.5 rounded-full text-xs font-bold leading-none transition-colors',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#D6CFC4]/50 text-[#3F3F46]'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContinuousTabs;
