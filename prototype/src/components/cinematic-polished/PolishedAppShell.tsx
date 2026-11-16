import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Compass, Layers, Play } from 'lucide-react';
import {
  HistorySessionRecord,
  INITIAL_HISTORY_SESSIONS,
} from '../../data/appRecords';
import { useWorkoutSimulator } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';
import { PolishedExerciseDetailView } from './PolishedExerciseDetailView';
import { PolishedHistoryView } from './PolishedHistoryView';
import { PolishedPlayerView } from './PolishedPlayerView';
import { PolishedTodayView } from './PolishedTodayView';
import { PolishedScreen } from './polishedMedia';

interface PolishedAppShellProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
  activeScreen: PolishedScreen;
  onChangeScreen: (screen: PolishedScreen) => void;
  selectedHistoryId: string | null;
  onSelectHistoryId: (id: string | null) => void;
  inspectedExerciseIdx?: number | null;
  onInspectExerciseIdx?: (idx: number | null) => void;
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
 * 精修版三页连续交互外壳（PolishedAppShell）：
 * - 使用 <LayoutGroup> 串联「今日 → 连续全屏动作详情 → 全屏跟练舞台 → 组间休息 → 总结与训练档案」
 * - 动作详情与全屏播放器共享 layoutId="cinematic-stage-media"，实现从上半幅实景到全屏舞台的无断层扩展
 * - 底部导航采用紧凑悬浮磨砂结构（仅在今日首页与档案列表显示）
 */
export const PolishedAppShell: React.FC<PolishedAppShellProps> = ({
  sim,
  deviceSize,
  reduceMotion = false,
  activeScreen,
  onChangeScreen,
  selectedHistoryId,
  onSelectHistoryId,
  inspectedExerciseIdx: controlledInspectIdx,
  onInspectExerciseIdx,
}) => {
  const [historyRecords, setHistoryRecords] = useState<HistorySessionRecord[]>(
    INITIAL_HISTORY_SESSIONS
  );
  const [localInspectIdx, setLocalInspectIdx] = useState<number | null>(null);
  const [justArchivedId, setJustArchivedId] = useState<string | null>(null);
  const recordedStartRef = useRef<string | null>(null);

  const inspectedIdx =
    controlledInspectIdx !== undefined ? controlledInspectIdx : localInspectIdx;
  const setInspectedIdx = (idx: number | null) => {
    setLocalInspectIdx(idx);
    onInspectExerciseIdx?.(idx);
  };

  useEffect(() => {
    if (
      sim.phase !== 'summary' ||
      sim.isDebugPreviewMode ||
      sim.sessionOutcome === 'in_progress' ||
      !sim.sessionStartedAt ||
      recordedStartRef.current === sim.sessionStartedAt
    ) {
      return;
    }

    recordedStartRef.current = sim.sessionStartedAt;
    const { dateLabel, isoDate, weekday } = getTodayDateParts();
    const plannedSetsCount =
      sim.plan.rounds *
      sim.plan.exercises.reduce((sum, ex) => sum + (ex.isUnilateral ? 2 : 1), 0);
    const id = `polished-live-${Date.now()}`;

    const newRecord: HistorySessionRecord = {
      id,
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
          ? '本次完成 0 组提前结束，已保留实录但未计入课程完成次数'
          : undefined,
    };

    setHistoryRecords((prev) => [newRecord, ...prev]);
    setJustArchivedId(id);
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

  const handleFinishToArchive = () => {
    sim.selectPlan(sim.planIndex);
    onSelectHistoryId(null);
    onChangeScreen('history');
  };

  const selectedHistoryRecord = selectedHistoryId
    ? historyRecords.find((r) => r.id === selectedHistoryId) ?? null
    : null;
  const isInPlayer = sim.phase !== 'today';
  const showExerciseDetail = !isInPlayer && activeScreen === 'today' && inspectedIdx !== null;
  const hideBottomBar =
    isInPlayer ||
    showExerciseDetail ||
    (activeScreen === 'history' && selectedHistoryRecord !== null);
  const isSE = deviceSize === 'se';

  return (
    <LayoutGroup id="polished-cinema-flow">
      <div className="relative h-full w-full overflow-hidden bg-[#11100F]">
        {/* 主页层（今日 / 训练档案） */}
        <AnimatePresence mode="sync">
          {!isInPlayer && (
            <motion.div
              key={`shell-${activeScreen}`}
              initial={reduceMotion ? false : { opacity: 0.45 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0.4 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
              className="absolute inset-0"
            >
              {activeScreen === 'today' ? (
                <PolishedTodayView
                  sim={sim}
                  deviceSize={deviceSize}
                  reduceMotion={reduceMotion}
                  onInspectExerciseIdx={setInspectedIdx}
                  onStartWorkout={() => {
                    setInspectedIdx(null);
                    sim.startPreparation();
                  }}
                />
              ) : (
                <PolishedHistoryView
                  deviceSize={deviceSize}
                  reduceMotion={reduceMotion}
                  records={historyRecords}
                  selectedRecord={selectedHistoryRecord}
                  onSelectRecord={(rec) => onSelectHistoryId(rec ? rec.id : null)}
                  justArchivedId={justArchivedId}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 连续全屏动作详情层（上半部影像与全屏播放器共享 layoutId 扩展通道） */}
        <AnimatePresence>
          {showExerciseDetail && inspectedIdx !== null && (
            <PolishedExerciseDetailView
              key="polished-exercise-detail"
              plan={sim.plan}
              exerciseIndex={inspectedIdx}
              deviceSize={deviceSize}
              reduceMotion={reduceMotion}
              getExerciseWeightLabel={sim.getExerciseWeightLabel}
              onChangeIndex={setInspectedIdx}
              onClose={() => setInspectedIdx(null)}
              onStartWorkout={() => {
                setInspectedIdx(null);
                sim.startPreparation();
              }}
            />
          )}
        </AnimatePresence>

        {/* 全屏播放器层（从今日或动作详情无缝扩展铺满全屏） */}
        <AnimatePresence>
          {isInPlayer && (
            <motion.div
              key="polished-player-layer"
              initial={reduceMotion ? false : { opacity: 0.65 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-30"
            >
              <PolishedPlayerView
                sim={sim}
                deviceSize={deviceSize}
                reduceMotion={reduceMotion}
                onFinishToArchive={handleFinishToArchive}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 紧凑底部导航栏（严格控制高度与遮罩，不吞没底部内容） */}
        <AnimatePresence>
          {!hideBottomBar && (
            <motion.div
              key="polished-bottom-nav"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
              className={`absolute inset-x-0 bottom-0 z-20 bg-[#11100F]/88 backdrop-blur-xl border-t border-[#F2EDE4]/10 px-5 pt-1.5 ${
                isSE ? 'pb-2' : 'pb-4'
              }`}
            >
              <nav aria-label="主导航" className="grid grid-cols-3 items-center">
                <button
                  type="button"
                  onClick={() => {
                    onSelectHistoryId(null);
                    onChangeScreen('today');
                  }}
                  aria-current={activeScreen === 'today' ? 'page' : undefined}
                  className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                    activeScreen === 'today'
                      ? 'text-[#F2EDE4]'
                      : 'text-[#948B80] hover:text-[#D8D0C5]'
                  }`}
                >
                  <Compass className="w-[18px] h-[18px]" />
                  <span className="text-[11px] font-medium leading-none">今日</span>
                </button>

                <button
                  type="button"
                  onClick={() => sim.startPreparation()}
                  className="min-h-[44px] flex flex-col items-center justify-center gap-1 text-[#D9BE94] hover:text-[#F2EDE4] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-[18px] h-[18px] fill-current" />
                  <span className="text-[11px] font-medium leading-none">开练</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectHistoryId(null);
                    onChangeScreen('history');
                  }}
                  aria-current={activeScreen === 'history' ? 'page' : undefined}
                  className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                    activeScreen === 'history'
                      ? 'text-[#F2EDE4]'
                      : 'text-[#948B80] hover:text-[#D8D0C5]'
                  }`}
                >
                  <Layers className="w-[18px] h-[18px]" />
                  <span className="text-[11px] font-medium leading-none">档案</span>
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
};
