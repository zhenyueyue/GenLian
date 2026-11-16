import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Check, RefreshCw, X } from 'lucide-react';
import {
  FlexibleWeekSlot,
  ScheduleAdjustmentLog,
  SubjectiveRecoveryState,
} from '../../data/appRecords';
import { WORKOUT_OPTIONS } from '../../data/workouts';
import { DeviceSize } from '../../types/design';

interface FlexiblePlanViewProps {
  deviceSize: DeviceSize;
  slots: FlexibleWeekSlot[];
  recovery: SubjectiveRecoveryState;
  adjustmentLogs: ScheduleAdjustmentLog[];
  onChangeRecovery: (state: SubjectiveRecoveryState) => void;
  onMoveSlot: (slotId: string, direction: -1 | 1) => void;
  onReplaceSlotPlan: (slotId: string, planIdx: number) => void;
  onPostponeSlot: (slotId: string) => void;
  onApplyPlanAsToday: (planId: string) => void;
}

const RECOVERY_OPTIONS: {
  id: SubjectiveRecoveryState;
  label: string;
  guidance: string;
}[] = [
  {
    id: 'fresh',
    label: '状态充沛',
    guidance: '肌肉无明显酸痛，可按正常节律推进下一次力量循环。',
  },
  {
    id: 'normal',
    label: '正常负荷',
    guidance: '日常节奏推进即可，动作质量优先于刻意加片。',
  },
  {
    id: 'fatigued',
    label: '略感疲惫',
    guidance: '建议优先插入「恢复日」或轻有氧，恢复是周期的正常部分，不计失败。',
  },
];

/**
 * 2. 弹性训练计划（Plan Tab）
 * - 破除固定星期二/四/六/日绑定，也不制造连续打卡压力
 * - 基于真实用户主观恢复自评（绝不虚构精准百分比）动态给出下一次建议
 * - 支持真实重排顺序、替换课程（含改恢复日）、主动推迟与历史灵活调整记录
 */
export const FlexiblePlanView: React.FC<FlexiblePlanViewProps> = ({
  deviceSize,
  slots,
  recovery,
  adjustmentLogs,
  onChangeRecovery,
  onMoveSlot,
  onReplaceSlotPlan,
  onPostponeSlot,
  onApplyPlanAsToday,
}) => {
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[52px]';
  const scrollBottomPad = isSE ? 'pb-24' : 'pb-28';

  const nextSlot =
    slots.find((s) => s.status === 'next') ??
    slots.find((s) => s.status === 'queued') ??
    slots[0];

  const recommendedPlan =
    recovery === 'fatigued'
      ? WORKOUT_OPTIONS[3]
      : WORKOUT_OPTIONS.find((w) => w.id === nextSlot?.planId) ?? WORKOUT_OPTIONS[0];

  const activeRecoveryInfo =
    RECOVERY_OPTIONS.find((r) => r.id === recovery) ?? RECOVERY_OPTIONS[1];

  const editingSlot = slots.find((s) => s.id === editingSlotId) ?? null;

  return (
    <div className="relative flex h-full flex-col bg-[#0B0D10] text-[#F1F3F5]">
      {/* 顶部标题 */}
      <div className={`${topSafePad} px-5 pb-3 border-b border-white/8 shrink-0`}>
        <div className="font-mono-num text-[11px] text-[#8E95A0]">
          ADAPTIVE CYCLE · 无固定星期绑定
        </div>
        <h1 className="font-display-b text-[22px] font-bold tracking-tight text-white mt-0.5">
          弹性训练计划
        </h1>
      </div>

      {/* 内容滚动区 */}
      <div className={`iphone-scroll flex-1 overflow-y-auto px-5 ${scrollBottomPad}`}>
        {/* 主观恢复状态反馈（严禁虚构精准恢复百分比） */}
        <section className="pt-4 pb-4 border-b border-white/8">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[13px] font-semibold text-white">当前主观恢复状态</span>
            <span className="text-[11.5px] text-[#8E95A0]">基于自身体感选择</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#16191E]">
            {RECOVERY_OPTIONS.map((opt) => {
              const active = recovery === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeRecovery(opt.id)}
                  className={`min-h-[38px] rounded-xl text-[12.5px] font-semibold transition-colors cursor-pointer ${
                    active
                      ? opt.id === 'fatigued'
                        ? 'bg-[#2C2418] text-[#E3A05B]'
                        : 'bg-[#C8F542] text-[#111315]'
                      : 'text-[#8E95A0] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <p className="mt-2.5 text-[12px] text-[#A2A8B0] leading-relaxed">
            {activeRecoveryInfo.guidance}
          </p>
        </section>

        {/* 推荐的下一次训练聚焦区 */}
        <section className="mt-4 rounded-[22px] bg-[#16191E] border border-white/8 p-4">
          <div className="flex items-center justify-between text-[11.5px]">
            <span
              className={`font-semibold ${
                recovery === 'fatigued' ? 'text-[#E3A05B]' : 'text-[#C8F542]'
              }`}
            >
              {recovery === 'fatigued' ? '恢复优先建议' : '推荐下一次训练'}
            </span>
            <span className="font-mono-num text-[#8E95A0]">
              {recommendedPlan.estimatedMinutesRange}
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            <img
              src={recommendedPlan.exercises[0].imageUrl}
              alt={recommendedPlan.title}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover shrink-0 bg-[#1F232A]"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] text-[#9EA4AE]">{recommendedPlan.category}</div>
              <div className="text-[16px] font-bold text-white truncate">
                {recommendedPlan.title}
              </div>
              <div className="text-[11.5px] text-[#8E95A0] truncate mt-0.5">
                {recommendedPlan.rounds} 轮 · {recommendedPlan.exercises.length} 动作/轮
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApplyPlanAsToday(recommendedPlan.id)}
              className="flex-1 h-[44px] rounded-full bg-[#C8F542] text-[#111315] text-[13.5px] font-extrabold cursor-pointer active:scale-[0.985] transition-transform"
            >
              设为今日训练并配置
            </button>
            {nextSlot && (
              <button
                type="button"
                onClick={() => setEditingSlotId(nextSlot.id)}
                className="h-[44px] px-4 rounded-full bg-[#22262E] text-white text-[13px] font-medium hover:bg-[#2A2F39] cursor-pointer whitespace-nowrap"
              >
                替换
              </button>
            )}
          </div>
        </section>

        {/* 本周弹性结构队列（可调整顺序 / 顺延 / 替换恢复日） */}
        <section className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[13px] font-semibold text-white">本周训练结构（可调序）</span>
            <span className="text-[11.5px] text-[#8E95A0]">可随时顺延或改恢复日</span>
          </div>

          <div className="divide-y divide-white/8 border-t border-white/8">
            {slots.map((slot, idx) => {
              const isDone = slot.status === 'completed';
              const isNext = slot.status === 'next';
              const isPostponed = slot.status === 'postponed';

              return (
                <div key={slot.id} className="py-3.5 flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center font-mono-num text-[11px] font-bold shrink-0 ${
                        isDone
                          ? 'bg-[#C8F542] text-[#111315]'
                          : isNext
                          ? 'bg-white text-[#111315]'
                          : 'bg-[#1B1F25] text-[#8E95A0]'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : `0${idx + 1}`}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11.5px] font-medium text-[#8E95A0]">
                          {slot.category}
                        </span>
                        <span aria-hidden="true" className="text-white/25">·</span>
                        <span
                          className={`text-[11.5px] font-medium ${
                            isDone
                              ? 'text-[#C8F542]'
                              : isNext
                              ? 'text-white'
                              : isPostponed
                              ? 'text-[#E3A05B]'
                              : 'text-[#8E95A0]'
                          }`}
                        >
                          {isDone
                            ? `${slot.completedDateLabel ?? '已完成'} · ${slot.durationMinutes ?? 30}m`
                            : isNext
                            ? '下一顺位'
                            : isPostponed
                            ? '已主动顺延'
                            : '待顺位安排'}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[14.5px] font-semibold text-white truncate">
                        {slot.title}
                      </div>
                      {slot.note && (
                        <div className="mt-0.5 text-[11.5px] text-[#7D8490] truncate">
                          {slot.note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 未完成的顺位支持移动顺序、替换与推迟 */}
                  {!isDone && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onMoveSlot(slot.id, -1)}
                        disabled={idx === 0 || slots[idx - 1]?.status === 'completed'}
                        aria-label="上移训练顺位"
                        className="h-9 w-8 rounded-lg bg-[#16191E] text-[#A2A8B0] hover:text-white disabled:opacity-25 flex items-center justify-center cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveSlot(slot.id, 1)}
                        disabled={idx === slots.length - 1}
                        aria-label="下移训练顺位"
                        className="h-9 w-8 rounded-lg bg-[#16191E] text-[#A2A8B0] hover:text-white disabled:opacity-25 flex items-center justify-center cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSlotId(slot.id)}
                        aria-label="调整或替换该顺位"
                        className="h-9 w-8 rounded-lg bg-[#16191E] text-[#A2A8B0] hover:text-white flex items-center justify-center cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 近期弹性调整记录 */}
        <section className="mt-5 pt-4 border-t border-white/8">
          <div className="text-[12.5px] font-semibold text-white mb-2">
            近期弹性调整记录（示例）
          </div>
          <div className="space-y-2">
            {adjustmentLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl bg-[#14171C] px-3.5 py-2.5 text-[12px]"
              >
                <div className="flex items-center justify-between text-[#E5E7EB] font-medium">
                  <span>{log.actionLabel}</span>
                  <span className="font-mono-num text-[11px] text-[#8E95A0]">{log.dateLabel}</span>
                </div>
                <div className="mt-1 text-[11.5px] text-[#8E95A0] leading-snug">
                  {log.reason}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 替换/顺延某顺位抽屉 */}
      {editingSlot && (
        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-xs flex flex-col justify-end">
          <div className={`rounded-t-3xl bg-[#16191E] p-5 ${isSE ? 'pb-5' : 'pb-8'}`}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[11.5px] text-[#8E95A0]">调整计划顺位</div>
                <div className="text-[16px] font-bold text-white">{editingSlot.title}</div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlotId(null)}
                className="h-9 w-9 rounded-full bg-white/8 flex items-center justify-center text-[#A2A8B0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {WORKOUT_OPTIONS.map((opt, idx) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onReplaceSlotPlan(editingSlot.id, idx);
                    setEditingSlotId(null);
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition-colors cursor-pointer ${
                    editingSlot.planId === opt.id
                      ? 'bg-[#C8F542] text-[#111315]'
                      : 'bg-[#101216] text-white hover:bg-[#1E222A]'
                  }`}
                >
                  <div className="text-[13.5px] font-bold">
                    替换为 {opt.category} · {opt.title}
                  </div>
                  <div
                    className={`text-[11.5px] mt-0.5 ${
                      editingSlot.planId === opt.id ? 'text-[#232B09]' : 'text-[#8E95A0]'
                    }`}
                  >
                    {opt.estimatedMinutesRange} · {opt.rounds} 轮
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                onPostponeSlot(editingSlot.id);
                setEditingSlotId(null);
              }}
              className="mt-3 w-full h-11 rounded-2xl bg-[#22262E] text-[13.5px] font-semibold text-white cursor-pointer"
            >
              主动推迟本顺位（不扣减完成记录）
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
