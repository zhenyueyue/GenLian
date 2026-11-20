import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Compass, Layers, Play } from 'lucide-react';
import {
  HistorySessionRecord,
  INITIAL_HISTORY_SESSIONS,
} from '../../data/appRecords';
import { useWorkoutSimulator } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';
import { PolishedScreen } from '../cinematic-polished/polishedMedia';
import { WarmExerciseDetailView } from './WarmExerciseDetailView';
import { GlassDock } from './WarmGlass';
import { WarmHistoryView } from './WarmHistoryView';
import { WarmPlayerView } from './WarmPlayerView';
import { WarmTodayView } from './WarmTodayView';
import { WARM_TOKENS } from './warmTokens';

interface WarmAppShellProps {
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

export const WarmAppShell: React.FC<WarmAppShellProps> = ({
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
    const id = `warm-live-${Date.now()}`;

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
  const hideBottomBar = isInPlayer || showExerciseDetail;
  const isSE = deviceSize === 'se';

  return (
    <LayoutGroup id="warm-performance-flow">
      <div
        className="relative h-full w-full overflow-hidden"
        style={{ backgroundColor: WARM_TOKENS.canvasBg }}
      >
        {/* 主页层（今日 / 训练档案） */}
        <AnimatePresence mode="sync">
          {!isInPlayer && (
            <motion.div
              key={`warm-shell-${activeScreen}`}
              initial={reduceMotion ? false : { opacity: 0.45 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0.4 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
              className="absolute inset-0"
            >
              {activeScreen === 'today' ? (
                <WarmTodayView
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
                <WarmHistoryView
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

        {/* 连续全屏动作详情层 */}
        <AnimatePresence>
          {showExerciseDetail && inspectedIdx !== null && (
            <WarmExerciseDetailView
              key="warm-detail"
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

        {/* 全屏跟练播放器层 */}
        <AnimatePresence>
          {isInPlayer && (
            <motion.div
              key="warm-player"
              initial={reduceMotion ? false : { opacity: 0.65 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-30"
            >
              <WarmPlayerView
                sim={sim}
                deviceSize={deviceSize}
                reduceMotion={reduceMotion}
                onFinishToArchive={handleFinishToArchive}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Apple iOS 26 液态玻璃悬浮底栏：高透折射胶囊 + 立体晶莹选中水滴透镜 */}
        <AnimatePresence>
          {!hideBottomBar && (
            <motion.div
              key="warm-bottom-nav"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 14 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none h-8 w-full"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(244,241,235,0) 0%, rgba(244,241,235,0.5) 100%)',
                }}
              />
              <GlassDock
                className="pointer-events-auto absolute inset-x-5 max-w-[348px] mx-auto"
                style={{
                  bottom: `calc(${isSE ? '12px' : '20px'} + env(safe-area-inset-bottom, 0px))`,
                }}
              >
                <nav
                  aria-label="主导航"
                  className="grid grid-cols-3 items-center gap-1"
                >
                  {(() => {
                    const isTodayActive = activeScreen === 'today';
                    const isHistoryActive = activeScreen === 'history';
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedIdx(null);
                            onSelectHistoryId(null);
                            onChangeScreen('today');
                          }}
                          aria-current={isTodayActive ? 'page' : undefined}
                          className="warm-lg-interactive relative h-[48px] rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                          style={{
                            color: isTodayActive
                              ? WARM_TOKENS.canvasBg
                              : WARM_TOKENS.inkSecondary,
                          }}
                        >
                          {isTodayActive && (
                            <motion.span
                              layoutId={reduceMotion ? undefined : 'warm-nav-active-capsule'}
                              transition={{
                                type: 'spring',
                                stiffness: 360,
                                damping: 28,
                                mass: 0.9,
                              }}
                              aria-hidden="true"
                              className="warm-lg-active-pill absolute inset-0 rounded-full"
                            />
                          )}
                          <span className="relative z-10 flex items-center justify-center gap-1.5">
                            <Compass
                              className="w-[17px] h-[17px]"
                              strokeWidth={isTodayActive ? 2.25 : 1.75}
                            />
                            <span
                              className={`text-[13px] leading-none tracking-[0.01em] ${
                                isTodayActive ? 'font-semibold' : 'font-medium'
                              }`}
                            >
                              今日
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setInspectedIdx(null);
                            sim.startPreparation();
                          }}
                          className="warm-lg-interactive relative h-[48px] rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap hover:bg-white/25"
                          style={{
                            color: WARM_TOKENS.inkPrimary,
                          }}
                        >
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: WARM_TOKENS.accent,
                              color: WARM_TOKENS.accentContrastText,
                              boxShadow: '0 6px 12px -6px rgba(194, 65, 12, 0.8)',
                            }}
                          >
                            <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                          </span>
                          <span className="text-[13px] font-semibold leading-none tracking-[0.01em]">
                            开练
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setInspectedIdx(null);
                            onSelectHistoryId(null);
                            onChangeScreen('history');
                          }}
                          aria-current={isHistoryActive ? 'page' : undefined}
                          className="warm-lg-interactive relative h-[48px] rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                          style={{
                            color: isHistoryActive
                              ? WARM_TOKENS.canvasBg
                              : WARM_TOKENS.inkSecondary,
                          }}
                        >
                          {isHistoryActive && (
                            <motion.span
                              layoutId={reduceMotion ? undefined : 'warm-nav-active-capsule'}
                              transition={{
                                type: 'spring',
                                stiffness: 360,
                                damping: 28,
                                mass: 0.9,
                              }}
                              aria-hidden="true"
                              className="warm-lg-active-pill absolute inset-0 rounded-full"
                            />
                          )}
                          <span className="relative z-10 flex items-center justify-center gap-1.5">
                            <Layers
                              className="w-[17px] h-[17px]"
                              strokeWidth={isHistoryActive ? 2.25 : 1.75}
                            />
                            <span
                              className={`text-[13px] leading-none tracking-[0.01em] ${
                                isHistoryActive ? 'font-semibold' : 'font-medium'
                              }`}
                            >
                              档案
                            </span>
                          </span>
                        </button>
                      </>
                    );
                  })()}
                </nav>
              </GlassDock>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
};
