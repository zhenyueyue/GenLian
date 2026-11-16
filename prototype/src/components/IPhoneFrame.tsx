import React from 'react';
import { DeviceSize } from '../types/design';

interface IPhoneFrameProps {
  children: React.ReactNode;
  deviceSize?: DeviceSize;
  statusBarTone?: 'light' | 'dark';
}

const DEVICE_DIMENSIONS: Record<
  DeviceSize,
  { width: string; height: string; label: string; hasDynamicIsland: boolean }
> = {
  promax: {
    width: 'w-[412px]',
    height: 'h-[886px]',
    label: 'iPhone 15 Pro Max (430×932 pt)',
    hasDynamicIsland: true,
  },
  standard: {
    width: 'w-[390px]',
    height: 'h-[844px]',
    label: 'iPhone 15 / Pro (393×852 pt)',
    hasDynamicIsland: true,
  },
  se: {
    width: 'w-[375px]',
    height: 'h-[690px]',
    label: 'iPhone SE / 小屏兼容 (375×667 pt)',
    hasDynamicIsland: false,
  },
};

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  children,
  deviceSize = 'promax',
  statusBarTone = 'light',
}) => {
  const isLightText = statusBarTone === 'light';
  const spec = DEVICE_DIMENSIONS[deviceSize];

  return (
    <div
      className={`relative mx-auto select-none transition-all duration-300 max-w-full ${spec.width} ${spec.height}`}
    >
      {/* Titanium / Aluminum outer shell */}
      <div
        className={`absolute inset-0 bg-[#1C1D20] p-[10px] shadow-[0_28px_70px_-16px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.08)_inset] ${
          spec.hasDynamicIsland ? 'rounded-[54px]' : 'rounded-[40px]'
        }`}
      >
        {/* Hardware side buttons */}
        <div className="absolute -left-[3px] top-[132px] h-7 w-[3px] rounded-l bg-[#2D2E33]" />
        <div className="absolute -left-[3px] top-[182px] h-12 w-[3px] rounded-l bg-[#2D2E33]" />
        <div className="absolute -left-[3px] top-[240px] h-12 w-[3px] rounded-l bg-[#2D2E33]" />
        <div className="absolute -right-[3px] top-[196px] h-16 w-[3px] rounded-r bg-[#2D2E33]" />

        {/* Screen viewport */}
        <div
          className={`relative flex h-full w-full flex-col overflow-hidden bg-[#111315] ${
            spec.hasDynamicIsland ? 'rounded-[44px]' : 'rounded-[30px]'
          }`}
        >
          {/* Status Bar + Dynamic Island */}
          <div
            className={`pointer-events-none absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-7 ${
              spec.hasDynamicIsland ? 'pt-[14px] pb-2' : 'pt-[10px] pb-1.5'
            } ${isLightText ? 'text-white' : 'text-[#141413]'}`}
          >
            <span className="font-mono-num text-[12px] font-semibold tracking-tight">07:42</span>

            {spec.hasDynamicIsland && (
              <div className="absolute left-1/2 top-[11px] h-[28px] w-[108px] -translate-x-1/2 rounded-full bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.07)] flex items-center justify-end pr-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#10131C] ring-1 ring-white/10" />
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <svg width="15" height="10" viewBox="0 0 15 10" fill="currentColor" aria-hidden="true">
                <rect x="0" y="6.5" width="2.4" height="3.5" rx="0.6" />
                <rect x="3.8" y="4.5" width="2.4" height="5.5" rx="0.6" />
                <rect x="7.6" y="2.5" width="2.4" height="7.5" rx="0.6" />
                <rect x="11.4" y="0.5" width="2.4" height="9.5" rx="0.6" opacity="0.35" />
              </svg>
              <svg width="22" height="11" viewBox="0 0 22 11" fill="none" aria-hidden="true">
                <rect
                  x="0.5"
                  y="0.5"
                  width="18.5"
                  height="10"
                  rx="2.6"
                  stroke="currentColor"
                  strokeOpacity="0.4"
                />
                <rect x="2" y="2" width="14" height="7" rx="1.4" fill="currentColor" />
                <path
                  d="M20.5 3.75V7.25C21.1 7.0 21.5 6.3 21.5 5.5C21.5 4.7 21.1 4.0 20.5 3.75Z"
                  fill="currentColor"
                  fillOpacity="0.45"
                />
              </svg>
            </div>
          </div>

          {/* App Content Canvas */}
          <div className="relative flex-1 overflow-hidden flex flex-col">{children}</div>

          {/* Home Indicator */}
          {spec.hasDynamicIsland && (
            <div
              className="pointer-events-none absolute bottom-[8px] left-1/2 z-30 h-[4.5px] w-[128px] -translate-x-1/2 rounded-full bg-current opacity-30"
              style={{ color: isLightText ? '#FFFFFF' : '#141413' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
