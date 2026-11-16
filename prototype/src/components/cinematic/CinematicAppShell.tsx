import React, { useEffect, useRef, useState } from 'react';
import { Compass, Film, Play } from 'lucide-react';
import {
  HistorySessionRecord,
  INITIAL_HISTORY_SESSIONS,
} from '../../data/appRecords';
import { useWorkoutSimulator } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';
import { CinematicHistoryView } from './CinematicHistoryView';
import { CinematicPlayerView } from './CinematicPlayerView';
import { CinematicTodayView } from './CinematicTodayView';
import { CinematicScreen } from './cinematicMedia';

interface CinematicAppShellProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
  activeScreen: CinematicScreen;
  onChangeScreen: (screen: CinematicScreen) => void;
  selectedHistoryId: string | null;
  onSelectHistoryId: (id: string | null) => void;
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
 * Cinematic Fitness 三页一体外壳：
 * 1. 「今天」沉浸式训练首页
 * 2. 「训练进行中」全屏运动播放器（进入时自动隐藏底栏，100% 电影舞台）
 * 3. 「训练历史」影像训练档案（含入档实时同步）
 */
export const CinematicAppShell: React.FC<CinematicAppShellProps> = ({
  sim,
  deviceSize,
  reduceMotion = false,
  activeScreen,
  onChangeScreen,
  selectedHistoryId,
  onSelectHistoryId,
}) => {
  const [historyRecords, setHistoryRecords] = useState<HistorySessionRecord[]>(
    INITIAL_HISTORY_SESSIONS
  );
  const recordedStartRef = useRef<string | null>(null);

  // 真实训练结束进入总结幕时，将实录自动入档至「训练档案」
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

    const newRecord: HistorySessionRecord = {
      id: `cinema-live-${Date.now()}`,
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

  // 只要进入训练状态（非 today），立即进入全屏运动播放器并隐藏底部导航
  if (sim.phase !== 'today') {
    return (
      <CinematicPlayerView
        sim={sim}
        deviceSize={deviceSize}
        reduceMotion={reduceMotion}
      />
    );
  }

  const selectedHistoryRecord = selectedHistoryId
    ? historyRecords.find((r) => r.id === selectedHistoryId) ?? null
    : null;
  const hideBottomBar = activeScreen === 'history' && selectedHistoryRecord !== null;
  const isSE = deviceSize === 'se';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B0908]">
      {activeScreen === 'today' ? (
        <CinematicTodayView
          sim={sim}
          deviceSize={deviceSize}
          reduceMotion={reduceMotion}
          onStartWorkout={() => sim.startPreparation()}
          onOpenArchive={() => {
            onSelectHistoryId(null);
            onChangeScreen('history');
          }}
        />
      ) : (
        <CinematicHistoryView
          deviceSize={deviceSize}
          records={historyRecords}
          selectedRecord={selectedHistoryRecord}
          onSelectRecord={(rec) => onSelectHistoryId(rec ? rec.id : null)}
        />
      )}

      {/* 极简克制的影院底部导航（绝不用厚重黑盒或荧光胶囊，仅保留浏览态切换） */}
      {!hideBottomBar && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#0B0908] via-[#0B0908]/92 to-transparent pt-5 px-5 ${
            isSE ? 'pb-2.5' : 'pb-6'
          }`}
        >
          <nav
            aria-label="Cinematic 主导航"
            className="pointer-events-auto grid grid-cols-3 items-center border-t border-[#F4EFE6]/10 pt-1.5"
          >
            <button
              type="button"
              onClick={() => {
                onSelectHistoryId(null);
                onChangeScreen('today');
              }}
              aria-current={activeScreen === 'today' ? 'page' : undefined}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeScreen === 'today'
                  ? 'text-[#F4EFE6]'
                  : 'text-[#70685F] hover:text-[#C8C0B5]'
              }`}
            >
              <Compass className="w-[18px] h-[18px]" />
              <span className="text-[10.5px] font-semibold leading-none">今天</span>
            </button>

            <button
              type="button"
              onClick={() => sim.startPreparation()}
              className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[#D9BE94] hover:text-[#F4EFE6] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-[18px] h-[18px] fill-current" />
              <span className="text-[10.5px] font-semibold leading-none">立即开练</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectHistoryId(null);
                onChangeScreen('history');
              }}
              aria-current={activeScreen === 'history' ? 'page' : undefined}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeScreen === 'history'
                  ? 'text-[#F4EFE6]'
                  : 'text-[#70685F] hover:text-[#C8C0B5]'
              }`}
            >
              <Film className="w-[18px] h-[18px]" />
              <span className="text-[10.5px] font-semibold leading-none">训练档案</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};
