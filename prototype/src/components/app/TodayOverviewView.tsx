import React from 'react';
import { ChevronRight, Dumbbell, Film, Settings, SlidersHorizontal } from 'lucide-react';
import {
  BODY_TREND_BRIEF,
  FlexibleWeekSlot,
  HistorySessionRecord,
  MainAppTab,
  SubjectiveRecoveryState,
} from '../../data/appRecords';
import { formatTimeMMSS, useWorkoutSimulator } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';

export type Phase2ModuleId = 'body' | 'equipment' | 'library' | 'settings';

interface TodayOverviewViewProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  slots: FlexibleWeekSlot[];
  recovery: SubjectiveRecoveryState;
  latestHistory: HistorySessionRecord;
  onStartQuickWorkout: () => void;
  onOpenTodaySetup: () => void;
  onNavigateTab: (tab: MainAppTab) => void;
  onOpenHistoryDetail: (record: HistorySessionRecord) => void;
  onOpenPhase2Module: (module: Phase2ModuleId) => void;
}

/**
 * 1. 训练总览（APP 主入口 · 今天 Tab）
 * - 明确单一视觉焦点：今日推荐训练头图与「开始今日训练」主触发
 * - 克制展示本周节律、最近一次训练、下次建议、身体趋势摘要（无堆砌卡片墙，无无意义分数）
 */
export const TodayOverviewView: React.FC<TodayOverviewViewProps> = ({
  sim,
  deviceSize,
  slots,
  recovery,
  latestHistory,
  onStartQuickWorkout,
  onOpenTodaySetup,
  onNavigateTab,
  onOpenHistoryDetail,
  onOpenPhase2Module,
}) => {
  const { plan } = sim;
  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[52px]';
  const scrollBottomPad = isSE ? 'pb-24' : 'pb-28';

  const completedCount = slots.filter((s) => s.status === 'completed').length;
  const strengthDone = slots.filter(
    (s) => s.status === 'completed' && (s.category === '力量 A' || s.category === '力量 B')
  ).length;
  const cardioDone = slots.filter((s) => s.status === 'completed' && s.category === '有氧').length;
  const nextSlot =
    slots.find((s) => s.status === 'next') ??
    slots.find((s) => s.status === 'queued') ??
    slots[0];

  const heroImage = plan.exercises[0]?.imageUrl;

  return (
    <div className="relative flex h-full flex-col bg-[#0B0D10] text-[#F1F3F5]">
      {/* 顶部栏：周期标签 + 第二阶段快捷入口（器材 / 课程库 / 设置） */}
      <div className={`${topSafePad} px-5 pb-3 flex items-center justify-between gap-2 shrink-0`}>
        <div className="min-w-0">
          <div className="font-mono-num text-[11px] text-[#8E95A0] truncate">
            第 9 周 · 弹性减脂塑形
          </div>
          <div className="font-display-b text-[19px] font-bold tracking-tight text-white leading-tight">
            今天
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenPhase2Module('equipment')}
            title="哑铃配重管理（第二阶段）"
            aria-label="哑铃配重管理"
            className="h-9 w-9 rounded-full bg-[#16191E] border border-white/8 flex items-center justify-center text-[#A2A8B0] hover:text-white transition-colors cursor-pointer"
          >
            <Dumbbell className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenPhase2Module('library')}
            title="NAS 与自编课程库（第二阶段）"
            aria-label="课程库"
            className="h-9 w-9 rounded-full bg-[#16191E] border border-white/8 flex items-center justify-center text-[#A2A8B0] hover:text-white transition-colors cursor-pointer"
          >
            <Film className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenPhase2Module('settings')}
            title="设置与个人资料（第二阶段）"
            aria-label="设置"
            className="h-9 w-9 rounded-full bg-[#16191E] border border-white/8 flex items-center justify-center text-[#A2A8B0] hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 主可滚动区 */}
      <div className={`iphone-scroll flex-1 overflow-y-auto px-5 ${scrollBottomPad}`}>
        {/* 核心视觉焦点：今日推荐训练大画幅入口 */}
        <section className="relative overflow-hidden rounded-[26px] bg-[#16191E]">
          <div className={`relative ${isSE ? 'h-[232px]' : 'h-[272px]'}`}>
            {heroImage && (
              <img
                src={heroImage}
                alt={plan.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-center"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/55 to-black/15" />

            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#C8F542]">
                <span>今日推荐</span>
                <span aria-hidden="true" className="text-white/35">·</span>
                <span className="text-white/85">{plan.category}</span>
                {recovery === 'fatigued' && (
                  <>
                    <span aria-hidden="true" className="text-white/35">·</span>
                    <span className="text-[#E3A05B]">当前反馈略疲惫</span>
                  </>
                )}
              </div>

              <h1
                className={`font-display-b mt-1 font-extrabold leading-[1.15] text-white text-balance ${
                  isSE ? 'text-[23px]' : 'text-[26px]'
                }`}
              >
                {plan.title}
              </h1>

              <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-white/80 font-mono-num">
                <span>{plan.estimatedMinutesRange}</span>
                <span aria-hidden="true">·</span>
                <span>{plan.rounds} 轮</span>
                <span aria-hidden="true">·</span>
                <span>{plan.exercises.length} 动作/轮</span>
              </div>

              {/* 双主次操作：实色高对比快速开练 + 轻盈玻璃进明细 */}
              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onStartQuickWorkout}
                  className="flex-1 h-[48px] rounded-full bg-[#C8F542] text-[#111315] text-[14.5px] font-extrabold flex items-center justify-center gap-1.5 active:scale-[0.985] transition-transform cursor-pointer"
                >
                  <span>开始今日训练</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={onOpenTodaySetup}
                  className="lg-optical-pill lg-optical-interactive h-[48px] px-4 rounded-full text-[13px] font-semibold text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>配重 / 明细</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 本周力量与有氧完成节律（无卡片嵌套，采用极简横幅分割线） */}
        <section className="mt-6 py-4 border-y border-white/8">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold text-white">本周弹性训练结构</span>
            <span className="font-mono-num text-[12px] text-[#C8F542]">
              已完成 {completedCount} / {slots.length} 次
            </span>
          </div>

          <div
            className="mt-2.5 grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}
          >
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`h-[4px] rounded-full ${
                  slot.status === 'completed'
                    ? 'bg-[#C8F542]'
                    : slot.status === 'next'
                    ? 'bg-white/75'
                    : 'bg-white/14'
                }`}
              />
            ))}
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[12px] text-[#8E95A0]">
            <span>力量 {strengthDone} 次 · 有氧 {cardioDone} 次</span>
            <span>不绑定固定周几</span>
          </div>
        </section>

        {/* 最近一次训练 & 下次建议训练 */}
        <section className="divide-y divide-white/8">
          <button
            type="button"
            onClick={() => onOpenHistoryDetail(latestHistory)}
            className="w-full py-4 flex items-center justify-between gap-3 text-left group cursor-pointer"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11.5px] text-[#8E95A0]">
                <span>最近一次训练</span>
                <span aria-hidden="true">·</span>
                <span>{latestHistory.isDemoData ? '演示实录' : '本次实录'}</span>
              </div>
              <div className="mt-1 text-[15px] font-semibold text-white truncate">
                {latestHistory.category} · {latestHistory.title}
              </div>
              <div className="mt-0.5 font-mono-num text-[12px] text-[#8E95A0]">
                {latestHistory.dateLabel} {latestHistory.weekday} ·{' '}
                {formatTimeMMSS(latestHistory.durationSeconds)} ·{' '}
                {latestHistory.outcome === 'completed'
                  ? '完整完成'
                  : latestHistory.outcome === 'early_exit_partial'
                  ? '部分完成'
                  : '提前结束（0组）'}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6E7580] group-hover:text-white shrink-0 transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('plan')}
            className="w-full py-4 flex items-center justify-between gap-3 text-left group cursor-pointer"
          >
            <div className="min-w-0">
              <div className="text-[11.5px] text-[#8E95A0]">弹性排程 · 下次建议</div>
              <div className="mt-1 text-[15px] font-semibold text-white truncate">
                {recovery === 'fatigued'
                  ? '建议插入：恢复日（胸椎肩髋舒展）'
                  : `${nextSlot.category} · ${nextSlot.title}`}
              </div>
              <div className="mt-0.5 text-[12px] text-[#8E95A0] truncate">
                {recovery === 'fatigued'
                  ? '依据当前疲惫自评调整，恢复日不计入失败'
                  : nextSlot.note ?? '可根据状态随时顺延或替换'}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6E7580] group-hover:text-white shrink-0 transition-colors" />
          </button>
        </section>

        {/* 身体变化简要趋势（精简克制，无复杂仪表盘，标明示例来源） */}
        <section className="mt-1 pt-4 border-t border-white/8">
          <button
            type="button"
            onClick={() => onNavigateTab('body')}
            className="w-full text-left flex items-center justify-between gap-4 cursor-pointer group"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11.5px] text-[#8E95A0]">
                <span>身体趋势摘要</span>
                <span aria-hidden="true">·</span>
                <span>{BODY_TREND_BRIEF.sourceNote}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-5">
                <div>
                  <span className="font-display-b text-[20px] font-bold text-white tabular-nums">
                    {BODY_TREND_BRIEF.weightKg.current}
                  </span>
                  <span className="text-[11.5px] text-[#8E95A0] ml-1">kg</span>
                  <span className="font-mono-num text-[11.5px] text-[#C8F542] ml-1.5">
                    {BODY_TREND_BRIEF.weightKg.delta}
                  </span>
                </div>
                <div>
                  <span className="font-display-b text-[20px] font-bold text-white tabular-nums">
                    {BODY_TREND_BRIEF.waistCm.current}
                  </span>
                  <span className="text-[11.5px] text-[#8E95A0] ml-1">cm 腰围</span>
                  <span className="font-mono-num text-[11.5px] text-[#C8F542] ml-1.5">
                    {BODY_TREND_BRIEF.waistCm.delta}
                  </span>
                </div>
              </div>
            </div>

            {/* 极简趋势折线图（非装饰卡片，48x24 纯线表达下降趋势） */}
            <div className="shrink-0 flex items-center gap-2">
              <svg width="56" height="24" viewBox="0 0 56 24" fill="none" aria-hidden="true">
                <path
                  d="M2 5 L12 7 L23 11 L34 13 L45 17 L54 19"
                  stroke="#C8F542"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="54" cy="19" r="2.2" fill="#C8F542" />
              </svg>
              <ChevronRight className="w-4 h-4 text-[#6E7580] group-hover:text-white transition-colors" />
            </div>
          </button>
        </section>
      </div>
    </div>
  );
};
