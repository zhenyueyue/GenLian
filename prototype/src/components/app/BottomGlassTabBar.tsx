import React from 'react';
import { Activity, CalendarDays, Compass, History } from 'lucide-react';
import { MainAppTab } from '../../data/appRecords';
import { DeviceSize } from '../../types/design';

interface BottomGlassTabBarProps {
  activeTab: MainAppTab;
  onSelectTab: (tab: MainAppTab) => void;
  deviceSize: DeviceSize;
}

const TABS: {
  id: MainAppTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'overview', label: '今天', icon: Compass },
  { id: 'plan', label: '计划', icon: CalendarDays },
  { id: 'history', label: '记录', icon: History },
  { id: 'body', label: '身体', icon: Activity },
];

/**
 * 统一顶层 4 标签悬浮 Liquid Glass 导航栏：
 * - 仅用于非训练浏览态；进入沉浸式跟练（prepare/active/rest/summary）时由外层自动隐藏。
 * - 严格遵守触控热区 >=44px、单行文字、克制荧光绿（仅作当前选中指示）。
 */
export const BottomGlassTabBar: React.FC<BottomGlassTabBarProps> = ({
  activeTab,
  onSelectTab,
  deviceSize,
}) => {
  const isSE = deviceSize === 'se';

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 ${
        isSE ? 'pb-3' : 'pb-6'
      } pt-6 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/70 to-transparent`}
    >
      <nav
        aria-label="主导航"
        className="pointer-events-auto lg-optical-pill rounded-full p-1 grid grid-cols-4 items-center"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`min-h-[46px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-white/12 text-[#C8F542]'
                  : 'text-[#A0A6B0] hover:text-white active:scale-95'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'stroke-[2.2]' : 'stroke-[1.75]'}`} />
              <span className="text-[10px] font-semibold tracking-tight leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
