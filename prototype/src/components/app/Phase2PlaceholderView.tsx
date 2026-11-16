import React from 'react';
import { ChevronLeft, Dumbbell, Film, Scale, Settings } from 'lucide-react';
import { DeviceSize } from '../../types/design';
import { Phase2ModuleId } from './TodayOverviewView';

interface Phase2PlaceholderViewProps {
  moduleId: Phase2ModuleId;
  deviceSize: DeviceSize;
  showBackButton?: boolean;
  onBack?: () => void;
  onSelectModule: (moduleId: Phase2ModuleId) => void;
}

const MODULE_META: Record<
  Phase2ModuleId,
  {
    title: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
    plannedCapabilities: string[];
  }
> = {
  body: {
    title: '身体数据与变化',
    subtitle: '第二阶段核心模块 · 本轮仅预留导航位置',
    icon: Scale,
    plannedCapabilities: [
      '体重 / 腰围 / 体脂率 / 肌肉量长期趋势图（标注家用体脂秤来源边界）',
      '双日期私密身材对比照片（纯本地存储，不自动上传分享）',
      '力量动作历史表现进步记录与手动数据录入',
    ],
  },
  equipment: {
    title: '哑铃配重管理',
    subtitle: '第二阶段核心模块 · 沿用真实片重库存逻辑',
    icon: Dumbbell,
    plannedCapabilities: [
      '库存盘点与左右两只哑铃对称装片可视化（1.25 / 1.5 / 2.0 / 2.5 kg × 4）',
      '塑料哑铃杆与锁扣安全承重实测录入前保持待确认警示',
      '减少训练中频繁拆片的循环配重组合建议与替代徒手动作',
    ],
  },
  library: {
    title: '课程库与 NAS 资源',
    subtitle: '第二阶段核心模块 · 界面先于真实 NAS 接入',
    icon: Film,
    plannedCapabilities: [
      '力量 / 有氧 / 核心 / 恢复分类浏览，整合个人循环与 NAS 视频课',
      '课程封面、时长、最近播放、收藏与完成记录',
      '明确区分本地示例数据与未来 NAS SMB/WebDAV 挂载状态',
    ],
  },
  settings: {
    title: '设置与个人资料',
    subtitle: '第二阶段核心模块 · 无商业社区与营销干扰',
    icon: Settings,
    plannedCapabilities: [
      '29岁 / 178cm / 74.5kg 薄肌目标与每周弹性训练量设定',
      '默认休息时间、自动推进、语音鸭声混音、视频播放与 NAS 地址偏好',
      '纯本地数据导出备份与深色/辅助功能开关',
    ],
  },
};

/**
 * 第二阶段模块诚实预览入口（Tab 4「身体」及顶栏「器材 / 课程库 / 设置」）：
 * 遵循本轮「分阶段交付」要求，清晰告知评审范围，不虚构未完成的图表或传感器功能。
 */
export const Phase2PlaceholderView: React.FC<Phase2PlaceholderViewProps> = ({
  moduleId,
  deviceSize,
  showBackButton = false,
  onBack,
  onSelectModule,
}) => {
  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[52px]';
  const scrollBottomPad = isSE ? 'pb-24' : 'pb-28';
  const info = MODULE_META[moduleId];
  const Icon = info.icon;

  return (
    <div className="relative flex h-full flex-col bg-[#0B0D10] text-[#F1F3F5]">
      <div className={`${topSafePad} px-5 pb-3 border-b border-white/8 flex items-center justify-between shrink-0`}>
        {showBackButton && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="min-h-[38px] pr-2 flex items-center gap-1 text-[13px] font-medium text-white hover:text-[#C8F542] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
        ) : (
          <div className="font-mono-num text-[11px] text-[#8E95A0]">PHASE 2 ROADMAP</div>
        )}
        <span className="font-mono-num text-[11px] text-[#E3A05B]">待第二阶段设计</span>
      </div>

      <div className={`iphone-scroll flex-1 overflow-y-auto px-5 pt-5 ${scrollBottomPad}`}>
        <div className="w-12 h-12 rounded-2xl bg-[#16191E] border border-white/10 flex items-center justify-center text-[#C8F542]">
          <Icon className="w-5 h-5" />
        </div>
        <h1 className="font-display-b mt-3.5 text-[24px] font-extrabold text-white">
          {info.title}
        </h1>
        <p className="mt-1 text-[13px] text-[#8E95A0]">{info.subtitle}</p>

        <div className="mt-5 rounded-2xl bg-[#16191E] border border-white/8 p-4 space-y-2.5">
          <div className="text-[12px] font-semibold text-white">计划包含的交互与能力边界</div>
          {info.plannedCapabilities.map((item) => (
            <div key={item} className="flex items-start gap-2 text-[12.5px] text-[#C8CDD6] leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C8F542] shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="text-[12px] font-semibold text-[#8E95A0] mb-2.5">
            第二阶段其余规划入口预览
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MODULE_META) as Phase2ModuleId[]).map((key) => {
              const m = MODULE_META[key];
              const active = key === moduleId;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectModule(key)}
                  className={`p-3 rounded-xl text-left border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1D221A] border-[#C8F542]/50 text-white'
                      : 'bg-[#16191E] border-white/8 text-[#9EA4AE] hover:text-white'
                  }`}
                >
                  <div className="text-[13px] font-semibold">{m.title}</div>
                  <div className="text-[11px] text-[#7D8490] mt-0.5">第二阶段</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
