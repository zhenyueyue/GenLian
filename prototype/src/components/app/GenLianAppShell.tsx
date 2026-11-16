import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import {
  FlexibleWeekSlot,
  HistorySessionRecord,
  INITIAL_ADJUSTMENT_LOGS,
  INITIAL_FLEXIBLE_SLOTS,
  INITIAL_HISTORY_SESSIONS,
  MainAppTab,
  ScheduleAdjustmentLog,
  SubjectiveRecoveryState,
} from '../../data/appRecords';
import { WORKOUT_OPTIONS } from '../../data/workouts';
import { useWorkoutSimulator } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';
import { LiquidGlassA11yConfig } from '../liquid/LiquidGlassPrimitives';
import { SchemeBLiquidGlassPrototype } from '../prototypes/SchemeBLiquidGlassPrototype';
import { SchemeBPrototype } from '../prototypes/SchemeBPrototype';
import { BottomGlassTabBar } from './BottomGlassTabBar';
import { FlexiblePlanView } from './FlexiblePlanView';
import { Phase2PlaceholderView } from './Phase2PlaceholderView';
import { Phase2ModuleId, TodayOverviewView } from './TodayOverviewView';
import { WorkoutHistoryView } from './WorkoutHistoryView';

interface GenLianAppShellProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  a11y: LiquidGlassA11yConfig;
  activeTab: MainAppTab;
  onChangeTab: (tab: MainAppTab) => void;
  showTodaySetup: boolean;
  onToggleTodaySetup: (show: boolean) => void;
  selectedHistoryId: string | null;
  onSelectHistoryId: (id: string | null) => void;
  phase2Subpage: Phase2ModuleId | null;
  onChangePhase2Subpage: (mod: Phase2ModuleId | null) => void;
}

function getTodayDateParts(): { dateLabel: string; isoDate: string; weekday: string } {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const y = now.getFullYear();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return {
    dateLabel: `${m}月${d}日`,
    isoDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    weekday: weekdays[now.getDay()] ?? '今日',
  };
}

/**
 * 「跟练」完整 APP 外壳（第一阶段）：
 * - 统一 4 标签悬浮 Liquid Glass 导航栏（今天 / 计划 / 记录 / 身体）
 * - 自动在训练进行态（prepare/active/setComplete/rest/nextTransition/summary）、配重配置明细页与历史详情子页隐藏底栏
 * - 真实衔接已定版的 B1.5 + 训练中 4 控件 Liquid Glass 播放器，并在训练结束时将真实会话写入历史记录与弹性周队列
 */
export const GenLianAppShell: React.FC<GenLianAppShellProps> = ({
  sim,
  deviceSize,
  a11y,
  activeTab,
  onChangeTab,
  showTodaySetup,
  onToggleTodaySetup,
  selectedHistoryId,
  onSelectHistoryId,
  phase2Subpage,
  onChangePhase2Subpage,
}) => {
  const [slots, setSlots] = useState<FlexibleWeekSlot[]>(INITIAL_FLEXIBLE_SLOTS);
  const [recovery, setRecovery] = useState<SubjectiveRecoveryState>('normal');
  const [adjustmentLogs, setAdjustmentLogs] = useState<ScheduleAdjustmentLog[]>(
    INITIAL_ADJUSTMENT_LOGS
  );
  const [historyRecords, setHistoryRecords] = useState<HistorySessionRecord[]>(
    INITIAL_HISTORY_SESSIONS
  );

  const recordedSessionStartRef = useRef<string | null>(null);
  const prevPhaseRef = useRef(sim.phase);

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[50px]';

  // 从训练总结点击“回到今日训练”时，收起二级配重明细层，回到总览
  useEffect(() => {
    if (prevPhaseRef.current === 'summary' && sim.phase === 'today' && showTodaySetup) {
      onToggleTodaySetup(false);
    }
    prevPhaseRef.current = sim.phase;
  }, [sim.phase, showTodaySetup, onToggleTodaySetup]);

  // 当真实训练进入总结页时，同步写入历史实录与周计划完成状态
  useEffect(() => {
    if (
      sim.phase !== 'summary' ||
      sim.isDebugPreviewMode ||
      sim.sessionOutcome === 'in_progress' ||
      !sim.sessionStartedAt ||
      recordedSessionStartRef.current === sim.sessionStartedAt
    ) {
      return;
    }

    recordedSessionStartRef.current = sim.sessionStartedAt;
    const { dateLabel, isoDate, weekday } = getTodayDateParts();
    const plannedSetsCount =
      sim.plan.rounds *
      sim.plan.exercises.reduce((sum, ex) => sum + (ex.isUnilateral ? 2 : 1), 0);

    const newRecord: HistorySessionRecord = {
      id: `live-${Date.now()}`,
      dateLabel,
      isoDate,
      weekday,
      planId: sim.plan.id,
      category: sim.plan.category,
      title: sim.plan.title,
      outcome: sim.sessionOutcome,
      durationSeconds: sim.elapsedSeconds,
      pausedSeconds: sim.pausedSeconds,
      startedAt: sim.sessionStartedAt,
      endedAt: sim.sessionEndedAt || sim.sessionStartedAt,
      plannedSetsCount,
      loggedSets: [...sim.loggedSets],
      skippedRecords: [...sim.skippedRecords],
      primaryWeightLabel: sim.activePlate ? sim.activePlate.shortLabel : '徒手/空杆',
      isDemoData: false,
      note:
        sim.sessionOutcome === 'early_exit_zero'
          ? '本次完成 0 组提前结束，已保留记录但未计入课程完成次数'
          : undefined,
    };

    setHistoryRecords((prev) => [newRecord, ...prev]);

    // 仅完整完成或部分完成（非 0 组提前结束）才在周弹性结构中推进
    if (sim.sessionOutcome === 'completed') {
      setSlots((prevSlots) => {
        let markedDone = false;
        const updated = prevSlots.map((slot) => {
          if (!markedDone && slot.status !== 'completed' && slot.planId === sim.plan.id) {
            markedDone = true;
            return {
              ...slot,
              status: 'completed' as const,
              completedDateLabel: `${weekday} 刚才`,
              durationMinutes: Math.max(1, Math.round(sim.elapsedSeconds / 60)),
            };
          }
          return slot;
        });

        if (!markedDone) return prevSlots;

        let promotedNext = false;
        return updated.map((slot) => {
          if (!promotedNext && slot.status === 'queued') {
            promotedNext = true;
            return { ...slot, status: 'next' as const };
          }
          return slot;
        });
      });
    }
  }, [
    sim.phase,
    sim.isDebugPreviewMode,
    sim.sessionOutcome,
    sim.sessionStartedAt,
    sim.sessionEndedAt,
    sim.elapsedSeconds,
    sim.pausedSeconds,
    sim.loggedSets,
    sim.skippedRecords,
    sim.plan,
    sim.activePlate,
  ]);

  // 1. 沉浸式跟练全屏舞台（prepare / active / setComplete / rest / nextTransition / summary）：自动隐藏 Tab Bar
  if (sim.phase !== 'today') {
    return <SchemeBLiquidGlassPrototype sim={sim} deviceSize={deviceSize} a11y={a11y} />;
  }

  // 2. 今日配重与动作明细二级页（复用已定版 B1.5 Today 页面，仅顶部附带返回总览导航）
  if (showTodaySetup) {
    return (
      <div className="relative flex h-full flex-col bg-[#111315]">
        <div
          className={`${topSafePad} px-4 pb-2.5 bg-[#111315] border-b border-white/8 flex items-center justify-between shrink-0 z-20`}
        >
          <button
            type="button"
            onClick={() => onToggleTodaySetup(false)}
            className="min-h-[38px] pr-2 flex items-center gap-1 text-[13px] font-medium text-white hover:text-[#C8F542] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>返回总览</span>
          </button>
          <span className="text-[12px] font-medium text-[#8E95A0]">今日配重与循环明细</span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden [&>div>div:first-child]:!pt-3">
          <SchemeBPrototype sim={sim} deviceSize={deviceSize} />
        </div>
      </div>
    );
  }

  // 3. 从总览顶栏进入的第二阶段二级页（哑铃 / 课程库 / 设置）：自动隐藏 Tab Bar
  if (phase2Subpage) {
    return (
      <Phase2PlaceholderView
        moduleId={phase2Subpage}
        deviceSize={deviceSize}
        showBackButton
        onBack={() => onChangePhase2Subpage(null)}
        onSelectModule={(mod) => onChangePhase2Subpage(mod)}
      />
    );
  }

  // 弹性计划操作回调
  const handleMoveSlot = (slotId: string, direction: -1 | 1) => {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.id === slotId);
      const targetIdx = idx + direction;
      if (idx < 0 || targetIdx < 0 || targetIdx >= prev.length) return prev;
      if (prev[idx].status === 'completed' || prev[targetIdx].status === 'completed') return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((s, i) => ({ ...s, slotOrder: i + 1 }));
    });
  };

  const handleReplaceSlotPlan = (slotId: string, planIdx: number) => {
    const picked = WORKOUT_OPTIONS[planIdx];
    if (!picked) return;
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              planId: picked.id,
              category: picked.category,
              title: picked.title,
              status: s.status === 'postponed' ? 'queued' : s.status,
              note: `已手动替换为「${picked.category}」`,
            }
          : s
      )
    );
    setAdjustmentLogs((prev) => [
      {
        id: `adj-${Date.now()}`,
        dateLabel: '刚刚',
        actionLabel: `顺位替换为「${picked.category}」`,
        reason: '根据当前体感与可用器械时长主动切换',
      },
      ...prev.slice(0, 3),
    ]);
  };

  const handlePostponeSlot = (slotId: string) => {
    const target = slots.find((s) => s.id === slotId);
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              status: 'postponed',
              note: '已主动顺延，不影响后续节奏，也不会扣减完成次数',
            }
          : s
      )
    );
    if (target) {
      setAdjustmentLogs((prev) => [
        {
          id: `adj-${Date.now()}`,
          dateLabel: '刚刚',
          actionLabel: `${target.category} 主动顺延`,
          reason: '优先保证恢复与生活节奏，顺延不计为失败',
        },
        ...prev.slice(0, 3),
      ]);
    }
  };

  const handleApplyPlanAsToday = (planId: string) => {
    const idx = WORKOUT_OPTIONS.findIndex((w) => w.id === planId);
    if (idx >= 0) {
      sim.selectPlan(idx);
    }
    onChangeTab('overview');
    onToggleTodaySetup(true);
  };

  const selectedHistoryRecord =
    selectedHistoryId ? historyRecords.find((r) => r.id === selectedHistoryId) ?? null : null;

  const hideTabBarForDrilldown = activeTab === 'history' && selectedHistoryRecord !== null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B0D10]">
      {activeTab === 'overview' && (
        <TodayOverviewView
          sim={sim}
          deviceSize={deviceSize}
          slots={slots}
          recovery={recovery}
          latestHistory={historyRecords[0]}
          onStartQuickWorkout={() => sim.startPreparation()}
          onOpenTodaySetup={() => onToggleTodaySetup(true)}
          onNavigateTab={(tab) => {
            onSelectHistoryId(null);
            onChangeTab(tab);
          }}
          onOpenHistoryDetail={(record) => {
            onChangeTab('history');
            onSelectHistoryId(record.id);
          }}
          onOpenPhase2Module={(mod) => {
            if (mod === 'body') {
              onChangeTab('body');
            } else {
              onChangePhase2Subpage(mod);
            }
          }}
        />
      )}

      {activeTab === 'plan' && (
        <FlexiblePlanView
          deviceSize={deviceSize}
          slots={slots}
          recovery={recovery}
          adjustmentLogs={adjustmentLogs}
          onChangeRecovery={setRecovery}
          onMoveSlot={handleMoveSlot}
          onReplaceSlotPlan={handleReplaceSlotPlan}
          onPostponeSlot={handlePostponeSlot}
          onApplyPlanAsToday={handleApplyPlanAsToday}
        />
      )}

      {activeTab === 'history' && (
        <WorkoutHistoryView
          deviceSize={deviceSize}
          records={historyRecords}
          selectedRecord={selectedHistoryRecord}
          onSelectRecord={(rec) => onSelectHistoryId(rec ? rec.id : null)}
        />
      )}

      {activeTab === 'body' && (
        <Phase2PlaceholderView
          moduleId="body"
          deviceSize={deviceSize}
          onSelectModule={(mod) => {
            if (mod !== 'body') {
              onChangePhase2Subpage(mod);
            }
          }}
        />
      )}

      {!hideTabBarForDrilldown && (
        <BottomGlassTabBar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            onSelectHistoryId(null);
            onChangeTab(tab);
          }}
          deviceSize={deviceSize}
        />
      )}
    </div>
  );
};
