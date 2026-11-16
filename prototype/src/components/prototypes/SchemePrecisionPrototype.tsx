import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { getDirectionExerciseVisual } from '../../data/brandMedia';
import { USER_CONTEXT, WORKOUT_OPTIONS } from '../../data/workouts';
import { formatTimeMMSS, useWorkoutSimulator } from '../../hooks/useWorkoutSimulator';
import { DeviceSize, EffortLevel } from '../../types/design';

interface SchemePrecisionPrototypeProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
}

/**
 * 方向 B · 精密运动设备（Precision Athletic Instrument）
 * 阳极氧化石墨（#111316）+ 精密钛灰面板（#181B20）+ 单一国际信号朱红（#E05A2B）
 * Manrope + IBM Plex Mono 精密刻度语言：无霓虹、无赛博朋克、无毛玻璃胶囊
 */
export const SchemePrecisionPrototype: React.FC<SchemePrecisionPrototypeProps> = ({
  sim,
  deviceSize,
}) => {
  const {
    phase,
    setPhase,
    isDebugPreviewMode,
    plan,
    planIndex,
    selectPlan,
    activePlate,
    PLATE_PRESETS,
    selectPlatePreset,
    showSwapDrawer,
    setShowSwapDrawer,
    showExitConfirm,
    setShowExitConfirm,
    postponedNote,
    setPostponedNote,
    customRestSeconds,
    setCustomRestSeconds,
    customRoundRestSeconds,
    setCustomRoundRestSeconds,
    restAutoAdvance,
    setRestAutoAdvance,
    currentRound,
    exerciseIdx,
    currentSide,
    setCurrentSide,
    currentExercise,
    activeVideoUrl,
    videoMuted,
    setVideoMuted,
    videoReplayToken,
    replayCurrentVideo,
    isLastExInRound,
    isLastRound,
    nextExerciseAfterRest,
    prevExercisePreview,
    totalExercisesInRound,
    restKind,
    restTriggeredBySet,
    restRemaining,
    restTargetTotal,
    actualRestElapsed,
    restWaitingManual,
    prepareRemaining,
    setCompleteAutoSec,
    autoAdvancePaused,
    transitionSec,
    elapsedSeconds,
    pausedSeconds,
    isPaused,
    setIsPaused,
    soundEnabled,
    setSoundEnabled,
    repDraft,
    setRepDraft,
    loggedSets,
    skippedRecords,
    sessionOutcome,
    sessionStartedAt,
    sessionEndedAt,
    getExerciseWeightLabel,
    startPreparation,
    skipPreparation,
    handleCompleteActiveSet,
    updateLatestSetReps,
    updateLatestSetEffort,
    goToRestNow,
    adjustActiveRest,
    skipRestToNext,
    startNextImmediately,
    skipCurrentExercise,
    goToPrevExercise,
    exitWorkoutEarly,
  } = sim;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);

  useEffect(() => {
    setVideoLoadFailed(false);
  }, [activeVideoUrl, currentExercise.id]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = videoMuted;
    }
  }, [videoMuted, activeVideoUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !activeVideoUrl) return;
    if (isPaused || phase === 'rest') {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
  }, [isPaused, phase, activeVideoUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !activeVideoUrl) return;
    el.currentTime = 0;
    if (!isPaused && phase !== 'rest') {
      el.play().catch(() => {});
    }
  }, [videoReplayToken, currentExercise.id, activeVideoUrl, isPaused, phase]);

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[54px]';
  const bottomSafePad = isSE ? 'pb-5' : 'pb-8';

  const totalSetsPerSession =
    plan.rounds *
    plan.exercises.reduce((sum, ex) => sum + (ex.isUnilateral ? 2 : 1), 0);

  const heroImage = getDirectionExerciseVisual(
    'precision',
    plan.exercises[0].id,
    plan.exercises[0].verticalImageUrl ?? plan.exercises[0].imageUrl
  );

  // 1. 今日训练（精密仪器规格表编排）
  if (phase === 'today') {
    return (
      <div className="font-precision-sans relative flex h-full flex-col bg-[#111316] text-[#F0F2F5]">
        {/* Top Instrument Header */}
        <div
          className={`${topSafePad} px-4 pb-2.5 flex items-center justify-between border-b border-[#252931] shrink-0`}
        >
          <div className="font-precision-mono text-[11px] tracking-[0.06em] text-[#8E96A3]">
            SESSION · 弹性安排
          </div>
          <button
            type="button"
            onClick={() => setShowSwapDrawer(true)}
            className="min-h-[34px] px-2.5 rounded-[4px] border border-[#2C313A] bg-[#181B20] flex items-center gap-1.5 text-[12px] font-medium text-[#F0F2F5] hover:border-[#59606B] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8E96A3]" />
            <span>更换 / 顺延</span>
          </button>
        </div>

        {/* Machined 4-Slot Selector Rail */}
        <div className="px-4 py-2.5 border-b border-[#252931] shrink-0">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-[6px] bg-[#181B20] border border-[#252931]">
            {WORKOUT_OPTIONS.map((opt, idx) => {
              const active = planIndex === idx && !postponedNote;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectPlan(idx)}
                  className={`min-h-[34px] rounded-[4px] text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    active
                      ? 'bg-[#282D36] text-[#F0F2F5]'
                      : 'text-[#8E96A3] hover:text-[#F0F2F5]'
                  }`}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-[#E05A2B] shrink-0" />}
                  <span>{opt.category}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Specification Body */}
        <div className="iphone-scroll flex-1 overflow-y-auto pb-6">
          {postponedNote ? (
            <div className="mx-4 mt-4 rounded-[6px] bg-[#181B20] border border-[#252931] p-5">
              <div className="font-precision-mono text-[11px] text-[#E05A2B]">STANDBY · 已顺延</div>
              <h2 className="mt-2 text-[22px] font-bold leading-snug text-[#F0F2F5]">
                今日留出恢复窗口
              </h2>
              <p className="mt-2.5 text-[13px] leading-relaxed text-[#8E96A3]">
                已将「{plan.title}」顺延至下次窗口。可随时恢复本课，或切至徒手恢复程序。
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPostponedNote(false)}
                  className="flex-1 h-11 rounded-[6px] bg-[#E05A2B] text-white text-[13.5px] font-semibold cursor-pointer"
                >
                  恢复今日训练
                </button>
                <button
                  type="button"
                  onClick={() => selectPlan(3)}
                  className="px-4 h-11 rounded-[6px] border border-[#2C313A] bg-[#111316] text-[#F0F2F5] text-[13px] font-medium cursor-pointer"
                >
                  切恢复日
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Clean Concrete Studio Frame + Machined Spec Grid */}
              <div className="mx-4 mt-3.5 rounded-[6px] overflow-hidden border border-[#252931] bg-[#181B20]">
                <div className={`relative overflow-hidden bg-[#1D2026] ${isSE ? 'h-[126px]' : 'h-[146px]'}`}>
                  {heroImage && (
                    <img
                      src={heroImage}
                      alt={plan.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-[50%_40%]"
                    />
                  )}
                </div>
                <div className="p-3.5 border-t border-[#252931]">
                  <div className="font-precision-mono text-[10.5px] text-[#8E96A3] truncate">
                    {plan.scheduleContext}
                  </div>
                  <h1 className="mt-1 text-[19px] font-bold tracking-[-0.015em] text-[#F0F2F5] leading-snug">
                    {plan.title}
                  </h1>
                  <div className="mt-3 grid grid-cols-3 border-t border-[#252931] pt-2.5 divide-x divide-[#252931] font-precision-mono">
                    <div className="pr-2">
                      <div className="text-[10px] text-[#6B7380]">预估耗时</div>
                      <div className="text-[12.5px] font-medium text-[#F0F2F5] mt-0.5">
                        {plan.estimatedMinutesRange}
                      </div>
                    </div>
                    <div className="px-2.5">
                      <div className="text-[10px] text-[#6B7380]">循环轮次</div>
                      <div className="text-[12.5px] font-medium text-[#F0F2F5] mt-0.5">
                        {plan.rounds} 轮
                      </div>
                    </div>
                    <div className="pl-2.5">
                      <div className="text-[10px] text-[#6B7380]">动作 / 总组</div>
                      <div className="text-[12.5px] font-medium text-[#F0F2F5] mt-0.5">
                        {plan.exercises.length} / {totalSetsPerSession} 组
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Symmetrical Plate Load Calibration */}
              {activePlate ? (
                <div className="mx-4 mt-4 pb-4 border-b border-[#252931]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-semibold text-[#F0F2F5]">
                      配重片校准（待确认示例）
                    </span>
                    <span className="font-precision-mono text-[11px] text-[#8E96A3]">
                      INV 29.0KG
                    </span>
                  </div>

                  {/* Symmetrical Dumbbell Plate Load Schematic */}
                  <div className="rounded-[6px] bg-[#181B20] border border-[#252931] p-3">
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#252931]">
                      <div className="flex items-center gap-1">
                        {activePlate.platesPerSideKg.length > 0 ? (
                          <>
                            {[...activePlate.platesPerSideKg].reverse().map((w, i) => (
                              <span
                                key={`l-${i}`}
                                className="px-1.5 py-0.5 rounded-[2px] bg-[#282D36] border border-[#3A404D] font-precision-mono text-[10px] text-[#F0F2F5]"
                              >
                                {w}
                              </span>
                            ))}
                            <span className="w-5 h-[3px] bg-[#59606B]" />
                            {activePlate.platesPerSideKg.map((w, i) => (
                              <span
                                key={`r-${i}`}
                                className="px-1.5 py-0.5 rounded-[2px] bg-[#282D36] border border-[#3A404D] font-precision-mono text-[10px] text-[#F0F2F5]"
                              >
                                {w}
                              </span>
                            ))}
                          </>
                        ) : (
                          <span className="font-precision-mono text-[11px] text-[#8E96A3]">
                            空杆 + 锁扣 [ 0.0 kg 片 ]
                          </span>
                        )}
                      </div>
                      <span className="font-precision-mono text-[12px] font-semibold text-[#F0F2F5] shrink-0">
                        {activePlate.plateSumPerDumbbellKg} kg片 + 杆
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#8E96A3] font-precision-mono">
                      <span className="truncate">{activePlate.inventoryUsage}</span>
                      {activePlate.cautionNote && (
                        <span className="text-[#D19441] shrink-0">需承重确认</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[#D19441] leading-snug">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{USER_CONTEXT.safetyDisclaimer}</span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto iphone-scroll pb-0.5">
                    {PLATE_PRESETS.map((preset) => {
                      const isSel = preset.id === activePlate.id;
                      const isHigh = preset.plateSumPerDumbbellKg >= 11.5;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => selectPlatePreset(preset)}
                          className={`min-h-[34px] px-2.5 rounded-[4px] font-precision-mono text-[11.5px] font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                            isSel
                              ? isHigh
                                ? 'bg-[#2C2115] text-[#D19441] border-[#D19441]'
                                : 'bg-[#282D36] text-[#F0F2F5] border-[#E05A2B]'
                              : 'bg-[#181B20] text-[#8E96A3] border-[#252931] hover:text-[#F0F2F5]'
                          }`}
                        >
                          {preset.plateSumPerDumbbellKg === 0
                            ? '空杆'
                            : `${preset.plateSumPerDumbbellKg}kg`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mx-4 mt-4 pb-4 border-b border-[#252931]">
                  <div className="font-precision-mono text-[11px] text-[#8E96A3]">EQUIPMENT</div>
                  <div className="mt-1 text-[13.5px] font-semibold text-[#F0F2F5]">
                    徒手无器械 · 仅需瑜伽垫
                  </div>
                </div>
              )}

              {/* Rest Timing Calibration */}
              <div className="mx-4 mt-4 pb-4 border-b border-[#252931]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12.5px] font-semibold text-[#F0F2F5]">间歇定时器</span>
                  <span className="font-precision-mono text-[11.5px] text-[#E05A2B]">
                    SET {customRestSeconds}s · ROUND {customRoundRestSeconds}s
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[30, 60, 90, 120].map((sec) => {
                    const active = customRestSeconds === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          setCustomRestSeconds(sec);
                          setCustomRoundRestSeconds(sec + 30);
                        }}
                        className={`min-h-[36px] rounded-[4px] font-precision-mono text-[12px] font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#F0F2F5] text-[#111316] border-[#F0F2F5]'
                            : 'bg-[#181B20] text-[#8E96A3] border-[#252931] hover:text-[#F0F2F5]'
                        }`}
                      >
                        {sec}s
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[12px]">
                  <span className="text-[#8E96A3]">计时归零模式</span>
                  <button
                    type="button"
                    onClick={() => setRestAutoAdvance(!restAutoAdvance)}
                    className="min-h-[32px] px-2.5 rounded-[4px] bg-[#181B20] border border-[#2C313A] text-[#F0F2F5] font-medium hover:border-[#59606B] transition-colors cursor-pointer"
                  >
                    {restAutoAdvance ? '自动切下一动作' : '待手动确认'}
                  </button>
                </div>
              </div>

              {/* Exercise Index Sequence */}
              <div className="px-4 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12.5px] font-semibold text-[#F0F2F5]">
                    循环执行序列（{plan.exercises.length} 项）
                  </span>
                  <span className="font-precision-mono text-[11px] text-[#8E96A3]">
                    {plan.rounds}R × {plan.exercises.length}EX
                  </span>
                </div>

                <div className="divide-y divide-[#20242B] border-t border-[#20242B]">
                  {plan.exercises.map((ex, idx) => (
                    <div key={ex.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="flex items-baseline gap-3 min-w-0">
                        <span className="font-precision-mono text-[12px] font-semibold text-[#E05A2B] shrink-0">
                          0{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[14.5px] font-semibold text-[#F0F2F5] truncate">
                            {ex.name}
                          </div>
                          <div className="mt-0.5 text-[11.5px] text-[#8E96A3] truncate">
                            [{ex.muscleGroup}] {ex.targetMuscle} · 节奏 {ex.tempo}
                          </div>
                          <div className="mt-0.5 font-precision-mono text-[10.5px] text-[#656C78] truncate">
                            {ex.isUnilateral ? 'L/R 单臂各 1 组 · ' : ''}
                            {ex.videoUrl ? 'VIDEO READY' : 'POSE REF ONLY'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pt-0.5 font-precision-mono">
                        <div className="text-[13px] font-semibold text-[#F0F2F5]">
                          {ex.targetReps} {ex.unit}
                        </div>
                        <div className="text-[11px] text-[#8E96A3] mt-0.5">
                          {ex.usesDumbbells
                            ? activePlate
                              ? `${activePlate.plateSumPerDumbbellKg}kg片`
                              : '空杆'
                            : '徒手'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fixed Tactile Hardware Dock */}
        {!postponedNote && (
          <div
            className={`shrink-0 bg-[#111316] border-t border-[#252931] px-4 pt-3 ${bottomSafePad}`}
          >
            <button
              type="button"
              onClick={startPreparation}
              className="w-full h-[52px] rounded-[6px] bg-[#E05A2B] hover:bg-[#CF4E21] text-white text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>开始今日跟练</span>
              <ChevronRight className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        )}

        {/* Swap Drawer */}
        {showSwapDrawer && (
          <div className="absolute inset-0 z-40 bg-black/75 flex flex-col justify-end">
            <div className={`bg-[#181B20] border-t border-[#2C313A] p-4 ${bottomSafePad}`}>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[15px] font-semibold text-[#F0F2F5]">切换或顺延程序</span>
                <button
                  type="button"
                  onClick={() => setShowSwapDrawer(false)}
                  className="min-h-[38px] min-w-[38px] flex items-center justify-center text-[#8E96A3] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1.5">
                {WORKOUT_OPTIONS.map((opt, idx) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectPlan(idx)}
                    className={`w-full text-left p-3 rounded-[6px] border transition-colors cursor-pointer ${
                      planIndex === idx
                        ? 'bg-[#282D36] text-[#F0F2F5] border-[#E05A2B]'
                        : 'bg-[#111316] text-[#C8D0DC] border-[#252931]'
                    }`}
                  >
                    <div className="text-[13.5px] font-semibold">
                      {opt.category} · {opt.title}
                    </div>
                    <div className="font-precision-mono text-[11px] text-[#8E96A3] mt-0.5">
                      {opt.estimatedMinutesRange} · REST {opt.defaultRestSeconds}s
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPostponedNote(true);
                  setShowSwapDrawer(false);
                }}
                className="mt-3 w-full h-11 rounded-[6px] border border-[#2C313A] bg-[#111316] text-[13px] font-medium text-[#F0F2F5] cursor-pointer"
              >
                今天状态一般，顺延至下次
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 7. 训练总结（同体系硬件日志格式）
  if (phase === 'summary') {
    const isCompleted = sessionOutcome === 'completed';
    const isZeroExit = sessionOutcome === 'early_exit_zero';
    const totalActualReps = loggedSets.reduce((sum, s) => sum + s.actualReps, 0);

    return (
      <div className="font-precision-sans relative flex h-full flex-col bg-[#111316] text-[#F0F2F5]">
        <div className={`iphone-scroll flex-1 overflow-y-auto px-4 pb-28 ${topSafePad}`}>
          <div
            className={`font-precision-mono text-[11px] font-medium ${
              isCompleted
                ? 'text-[#E05A2B]'
                : isZeroExit
                ? 'text-[#D19441]'
                : 'text-[#8E96A3]'
            }`}
          >
            {isCompleted
              ? 'SESSION COMPLETE · 完整达成'
              : isZeroExit
              ? 'ABORTED · 完成 0 组'
              : 'PARTIAL LOG · 提前结束'}
          </div>
          <h1 className="mt-1.5 text-[24px] font-bold leading-tight text-[#F0F2F5]">
            {isCompleted
              ? '按计划完成全部轮次'
              : isZeroExit
              ? '未计入完整课程完成次数'
              : '已保存实录，不影响后续安排'}
          </h1>
          <p className="font-precision-mono mt-1.5 text-[11.5px] text-[#8E96A3]">
            {sessionStartedAt || '--:--:--'} → {sessionEndedAt || '--:--:--'} · PAUSE{' '}
            {pausedSeconds}s
          </p>

          {/* 3-Cell Instrument Readout */}
          <div className="mt-4 grid grid-cols-3 rounded-[6px] bg-[#181B20] border border-[#252931] divide-x divide-[#252931]">
            <div className="p-3">
              <div className="font-precision-mono text-[22px] font-semibold text-[#F0F2F5]">
                {loggedSets.length}
              </div>
              <div className="text-[11px] text-[#8E96A3] mt-0.5">完成组数</div>
            </div>
            <div className="p-3">
              <div className="font-precision-mono text-[22px] font-semibold text-[#F0F2F5]">
                {totalActualReps}
              </div>
              <div className="text-[11px] text-[#8E96A3] mt-0.5">总次数/秒</div>
            </div>
            <div className="p-3">
              <div className="font-precision-mono text-[22px] font-semibold text-[#E05A2B]">
                {formatTimeMMSS(elapsedSeconds)}
              </div>
              <div className="text-[11px] text-[#8E96A3] mt-0.5">有效用时</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12.5px] font-semibold text-[#F0F2F5]">
                逐组实录日志
              </span>
              <span className="font-precision-mono text-[11px] text-[#8E96A3]">
                {loggedSets.length} SETS
              </span>
            </div>

            {loggedSets.length === 0 ? (
              <div className="rounded-[6px] bg-[#181B20] border border-[#252931] p-4 text-[12.5px] text-[#8E96A3] leading-relaxed">
                未记录完成组，系统不伪造数据，亦不计入完整课程完成次数。
              </div>
            ) : (
              <div className="divide-y divide-[#20242B] border-t border-[#20242B]">
                {loggedSets.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-2 text-[12px]"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#F0F2F5] truncate">
                        R{item.round} · {item.exerciseName}
                        {item.side === 'left' ? ' [L]' : item.side === 'right' ? ' [R]' : ''}
                      </div>
                      <div className="font-precision-mono text-[11px] text-[#8E96A3] mt-0.5">
                        {item.weightUsed} · REST {item.actualRestSeconds}s
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-precision-mono">
                      <div className="font-semibold text-[#F0F2F5]">
                        {item.actualReps}/{item.targetReps} {item.unit}
                      </div>
                      <div className="text-[11px] text-[#8E96A3]">{item.effort}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {skippedRecords.length > 0 && (
            <div className="mt-5">
              <div className="font-precision-mono text-[11px] font-semibold text-[#D19441] mb-2">
                SKIPPED ({skippedRecords.length})
              </div>
              <div className="space-y-1.5">
                {skippedRecords.map((sk, idx) => (
                  <div
                    key={`${sk.timestamp}-${idx}`}
                    className="rounded-[4px] bg-[#181B20] border border-[#252931] px-3 py-2 text-[12px] text-[#8E96A3] flex items-center justify-between"
                  >
                    <span>
                      R{sk.round} · {sk.exerciseName}
                    </span>
                    <span className="font-precision-mono text-[11px]">{sk.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className={`shrink-0 bg-[#111316] border-t border-[#252931] px-4 pt-3 ${bottomSafePad}`}
        >
          <button
            type="button"
            onClick={() => selectPlan(planIndex)}
            className="w-full h-[52px] rounded-[6px] bg-[#E05A2B] text-white text-[15px] font-semibold cursor-pointer"
          >
            完成并回今日训练
          </button>
        </div>
      </div>
    );
  }

  // 2–6. 动作舞台 / 休息 / 过渡（精密混凝土影棚 + 机械刻度控件）
  const latestLogged = loggedSets[loggedSets.length - 1];
  const hasRealVideo = Boolean(activeVideoUrl) && !videoLoadFailed;
  const stagePhoto = getDirectionExerciseVisual(
    'precision',
    currentExercise.id,
    currentExercise.hasVerifiedPoseImage
      ? currentExercise.verticalImageUrl ?? currentExercise.imageUrl
      : undefined
  );
  const nextPhoto = nextExerciseAfterRest
    ? getDirectionExerciseVisual(
        'precision',
        nextExerciseAfterRest.id,
        nextExerciseAfterRest.imageUrl
      )
    : undefined;

  const isStandbyMode = phase === 'rest' || phase === 'prepare' || phase === 'nextTransition';
  const isFinal3Sec = phase === 'rest' && restRemaining <= 3 && restRemaining > 0;
  const restRatio = Math.max(0, Math.min(1, restRemaining / Math.max(1, restTargetTotal)));
  const repsModified = repDraft !== currentExercise.targetReps;

  return (
    <div className="font-precision-sans relative flex h-full flex-col overflow-hidden bg-[#111316] text-[#F0F2F5]">
      {/* Top Machined Telemetry Header */}
      <div className={`relative z-20 bg-[#111316]/90 border-b border-[#252931] ${topSafePad} px-4 pb-2.5 shrink-0`}>
        {/* Millimeter Segmented Track */}
        <div
          className="grid gap-1 mb-2.5"
          style={{ gridTemplateColumns: `repeat(${totalExercisesInRound}, minmax(0, 1fr))` }}
        >
          {plan.exercises.map((ex, idx) => {
            const done = idx < exerciseIdx;
            const curr = idx === exerciseIdx;
            return (
              <div
                key={ex.id}
                className={`h-[3px] transition-colors ${
                  done ? 'bg-[#C8D0DC]' : curr ? 'bg-[#E05A2B]' : 'bg-[#262A32]'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="min-h-[34px] px-2.5 rounded-[4px] border border-[#2C313A] bg-[#181B20] text-[12px] font-medium text-[#F0F2F5] flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#8E96A3]" />
            <span>退出</span>
          </button>

          <div className="font-precision-mono text-[11.5px] font-medium text-[#F0F2F5] whitespace-nowrap truncate">
            <span>R{currentRound}/{plan.rounds}</span>
            <span className="mx-1.5 text-[#59606B]" aria-hidden="true">|</span>
            <span>0{exerciseIdx + 1}/0{totalExercisesInRound}</span>
            <span className="mx-1.5 text-[#59606B]" aria-hidden="true">|</span>
            <span className="text-[#C8D0DC]">{formatTimeMMSS(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`min-h-[34px] min-w-[34px] rounded-[4px] border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-[#181B20] border-[#E05A2B] text-[#E05A2B]'
                : 'bg-[#181B20] border-[#2C313A] text-[#6B7380]'
            }`}
            aria-label="语音与提示音开关"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {(phase === 'active' || phase === 'prepare') && (
          <div className="mt-1.5 flex items-center justify-between gap-2 font-precision-mono text-[10.5px] text-[#8E96A3]">
            <span className="truncate">
              {hasRealVideo
                ? 'LOOP VIDEO ACTIVE · 自由节奏完成次数'
                : 'POSE REFERENCE · 按自身呼吸节奏执行'}
            </span>
            {isDebugPreviewMode && (
              <span className="shrink-0 text-[#D19441]">[PREVIEW]</span>
            )}
          </div>
        )}
      </div>

      {/* Main Stage (Unobstructed Concrete Studio Media or Standby Calibration) */}
      <div className="relative flex-1 overflow-hidden bg-[#0D0F12]">
        {hasRealVideo ? (
          <video
            ref={videoRef}
            key={`${currentExercise.id}-${activeVideoUrl}`}
            src={activeVideoUrl}
            autoPlay
            loop
            muted={videoMuted}
            playsInline
            onError={() => setVideoLoadFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ${
              phase === 'rest'
                ? 'opacity-12 grayscale scale-[1.02]'
                : phase === 'prepare' || phase === 'nextTransition'
                ? 'opacity-20 scale-[1.01]'
                : phase === 'setComplete'
                ? 'brightness-[0.5]'
                : 'opacity-100'
            }`}
          />
        ) : stagePhoto ? (
          <img
            src={stagePhoto}
            alt={currentExercise.name}
            referrerPolicy="no-referrer"
            className={`absolute inset-0 h-full w-full object-cover object-[50%_42%] transition-all duration-500 ${
              phase === 'rest'
                ? 'opacity-12 grayscale scale-[1.02]'
                : phase === 'prepare' || phase === 'nextTransition'
                ? 'opacity-22 scale-[1.01]'
                : phase === 'setComplete'
                ? 'brightness-[0.5]'
                : 'opacity-100'
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#14171C] px-8 text-center">
            <Film className="w-6 h-6 text-[#6B7380] mb-3" />
            <div className="text-[13.5px] font-semibold text-[#F0F2F5]">暂无动作实拍视频</div>
            <div className="mt-1 text-[12px] text-[#8E96A3] max-w-[230px]">
              请依据下方动作规格与目标肌群自行把控幅度
            </div>
          </div>
        )}

        {/* Active Lower Legibility Band (clean subtle gradient only at very bottom edge) */}
        {phase === 'active' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#111316] via-[#111316]/72 to-transparent" />
        )}

        {/* Active Stage Overlay: Exercise Spec (Left) + Micrometer Rep Dial (Right) */}
        {phase === 'active' && (
          <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              {currentExercise.isUnilateral && (
                <div className="mb-2 inline-flex items-center p-0.5 rounded-[4px] bg-[#181B20]/95 border border-[#2C313A]">
                  <button
                    type="button"
                    onClick={() => setCurrentSide('left')}
                    className={`min-h-[28px] px-2.5 rounded-[3px] font-precision-mono text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      currentSide === 'left'
                        ? 'bg-[#E05A2B] text-white'
                        : 'text-[#8E96A3] hover:text-[#F0F2F5]'
                    }`}
                  >
                    L {currentSide === 'right' ? '✓' : '左侧'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSide('right')}
                    className={`min-h-[28px] px-2.5 rounded-[3px] font-precision-mono text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      currentSide === 'right'
                        ? 'bg-[#E05A2B] text-white'
                        : 'text-[#8E96A3] hover:text-[#F0F2F5]'
                    }`}
                  >
                    R 右侧
                  </button>
                </div>
              )}

              <div className="font-precision-mono text-[11px] text-[#C8D0DC] truncate">
                [{currentExercise.muscleGroup}] {getExerciseWeightLabel(currentExercise.usesDumbbells)} ·{' '}
                {currentExercise.tempo}
              </div>
              <h1
                className={`mt-0.5 font-bold leading-tight text-[#F0F2F5] truncate drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)] ${
                  isSE ? 'text-[20px]' : 'text-[23px]'
                }`}
              >
                {currentExercise.name}
              </h1>
              <p className="mt-0.5 text-[12px] text-[#D2D7E0] line-clamp-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                {soundEnabled ? currentExercise.voiceCue : currentExercise.targetMuscle}
              </p>

              {hasRealVideo && (
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={replayCurrentVideo}
                    className="min-h-[30px] px-2.5 rounded-[4px] bg-[#181B20]/95 border border-[#2C313A] font-precision-mono text-[11px] text-[#F0F2F5] flex items-center gap-1 whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>REPLAY</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMuted(!videoMuted)}
                    className="min-h-[30px] px-2.5 rounded-[4px] bg-[#181B20]/95 border border-[#2C313A] font-precision-mono text-[11px] text-[#F0F2F5] flex items-center gap-1 whitespace-nowrap cursor-pointer"
                  >
                    {videoMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    <span>{videoMuted ? 'MUTED' : 'AUDIO'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Micrometer Rep Dial */}
            <div className="shrink-0 flex flex-col items-center rounded-[6px] bg-[#181B20]/96 border border-[#2C313A] overflow-hidden">
              <button
                type="button"
                onClick={() => setRepDraft((r) => r + 1)}
                className="h-10 w-12 text-[#F0F2F5] hover:bg-[#232730] font-precision-mono text-[17px] font-medium flex items-center justify-center active:bg-[#2B303B] cursor-pointer"
                aria-label="增加次数"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setRepDraft(currentExercise.targetReps)}
                title="点击重置目标次数"
                className="w-12 py-1.5 border-y border-[#2C313A] bg-[#111316] text-center cursor-pointer"
              >
                <div
                  className={`font-precision-mono text-[23px] font-semibold leading-none ${
                    repsModified ? 'text-[#E05A2B]' : 'text-[#F0F2F5]'
                  }`}
                >
                  {repDraft}
                </div>
                <div className="mt-1 flex items-center justify-center gap-0.5 px-1">
                  <span className="h-[1px] flex-1 bg-[#363B46]" />
                  <span className="font-precision-mono text-[9px] text-[#8E96A3]">
                    {repsModified ? `${currentExercise.targetReps}` : currentExercise.unit}
                  </span>
                  <span className="h-[1px] flex-1 bg-[#363B46]" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRepDraft((r) => Math.max(1, r - 1))}
                className="h-10 w-12 text-[#F0F2F5] hover:bg-[#232730] font-precision-mono text-[17px] font-medium flex items-center justify-center active:bg-[#2B303B] cursor-pointer"
                aria-label="减少次数"
              >
                −
              </button>
            </div>
          </div>
        )}

        {/* Standby Center Calibration Views (Prepare / Rest / Next Transition) */}
        {isStandbyMode && (
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-5">
            <AnimatePresence mode="wait">
              {phase === 'prepare' && (
                <motion.div
                  key="pr-prepare"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-center"
                >
                  <div className="font-precision-mono text-[11px] tracking-[0.12em] text-[#E05A2B]">
                    PREPARE · 就位准备
                  </div>
                  <h2 className="mt-2 text-[25px] font-bold text-[#F0F2F5]">
                    {currentExercise.name}
                  </h2>
                  <div className="font-precision-mono my-5 text-[82px] font-medium leading-none text-[#F0F2F5]">
                    {prepareRemaining}
                  </div>
                  <p className="text-[13px] text-[#A2AAB8] max-w-[260px] mx-auto leading-relaxed">
                    {currentExercise.nextPrepCue}
                  </p>
                </motion.div>
              )}

              {phase === 'rest' && (
                <motion.div
                  key="pr-rest"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center text-center w-full"
                >
                  {!restTriggeredBySet && loggedSets.length === 0 && (
                    <div className="mb-3 font-precision-mono text-[11px] text-[#D19441]">
                      STANDBY PREVIEW · 不计入完成实录
                    </div>
                  )}

                  <div
                    className={`font-precision-mono text-[11.5px] tracking-[0.08em] ${
                      isFinal3Sec || restWaitingManual ? 'text-[#E05A2B]' : 'text-[#8E96A3]'
                    }`}
                  >
                    {restWaitingManual
                      ? 'TIMER COMPLETE · 等待继续'
                      : restKind === 'round'
                      ? `ROUND ${currentRound} COMPLETE · 轮间恢复`
                      : 'INTERVAL RECOVERY · 组间休息'}
                  </div>

                  {/* Pure Precision Typographic Dial (Zero cheap thick circle) */}
                  <div
                    className={`font-precision-mono mt-3 font-medium leading-none tracking-[-0.04em] transition-colors ${
                      isSE ? 'text-[72px]' : 'text-[84px]'
                    } ${isFinal3Sec || restWaitingManual ? 'text-[#E05A2B]' : 'text-[#F0F2F5]'}`}
                  >
                    {formatTimeMMSS(restRemaining)}
                  </div>

                  {/* Calibrated Linear Tick Scale */}
                  <div className="mt-5 w-full max-w-[244px]">
                    <div className="h-[2px] w-full bg-[#252931] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isFinal3Sec || restWaitingManual ? 'bg-[#E05A2B]' : 'bg-[#F0F2F5]'
                        }`}
                        style={{ width: `${restRatio * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between px-[1px]">
                      {[0, 25, 50, 75, 100].map((mark) => (
                        <span key={mark} className="w-[1px] h-1.5 bg-[#3B414D]" />
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 font-precision-mono text-[11px] text-[#8E96A3] flex items-center gap-2">
                    <span>REAL {actualRestElapsed}s</span>
                    <span className="text-[#454C59]" aria-hidden="true">/</span>
                    <span>SET {restTargetTotal}s</span>
                  </div>

                  {/* Next Exercise Instrument Row */}
                  {nextExerciseAfterRest && (
                    <div className="mt-7 w-full max-w-[320px] rounded-[6px] bg-[#181B20] border border-[#252931] p-2.5 flex items-center gap-3 text-left">
                      {nextPhoto && (
                        <img
                          src={nextPhoto}
                          alt={nextExerciseAfterRest.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-[4px] object-cover shrink-0 bg-[#232730]"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-precision-mono text-[10.5px] text-[#E05A2B] truncate">
                          NEXT · {nextExerciseAfterRest.targetReps} {nextExerciseAfterRest.unit}
                          {nextExerciseAfterRest.isUnilateral ? ' [L/R]' : ''}
                        </div>
                        <div className="text-[14px] font-semibold text-[#F0F2F5] truncate mt-0.5">
                          {nextExerciseAfterRest.name}
                        </div>
                        <div className="text-[11px] text-[#8E96A3] truncate">
                          {nextExerciseAfterRest.nextPrepCue}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {phase === 'nextTransition' && (
                <motion.div
                  key="pr-next"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-center max-w-[310px]"
                >
                  <div className="font-precision-mono text-[11px] tracking-[0.08em] text-[#E05A2B]">
                    {exerciseIdx === 0 && currentRound > 1
                      ? `ROUND ${currentRound} START`
                      : `NEXT · 0${exerciseIdx + 1}/0${totalExercisesInRound}`}
                  </div>
                  <h2 className="mt-2 text-[28px] font-bold leading-tight text-[#F0F2F5]">
                    {currentExercise.name}
                  </h2>
                  <div className="font-precision-mono mt-1.5 text-[12px] text-[#8E96A3]">
                    [{currentExercise.muscleGroup}] {getExerciseWeightLabel(currentExercise.usesDumbbells)} ·{' '}
                    {currentExercise.targetReps} {currentExercise.unit}
                  </div>
                  <p className="mt-2.5 text-[13px] text-[#C8D0DC] leading-relaxed">
                    {currentExercise.nextPrepCue}
                  </p>
                  <div className="font-precision-mono mt-5 text-[50px] font-medium leading-none text-[#E05A2B]">
                    {transitionSec}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Machined Hardware Control Dock */}
      <div className={`relative z-20 bg-[#111316] border-t border-[#252931] px-4 pt-3 ${bottomSafePad}`}>
        {phase === 'prepare' && (
          <button
            type="button"
            onClick={skipPreparation}
            className="w-full h-[52px] rounded-[6px] bg-[#E05A2B] text-white text-[15px] font-semibold active:scale-[0.99] transition-transform cursor-pointer"
          >
            我已就位，立即开练
          </button>
        )}

        {phase === 'active' && (
          <div>
            <button
              type="button"
              onClick={handleCompleteActiveSet}
              className="w-full h-[50px] rounded-[6px] bg-[#E05A2B] hover:bg-[#CF4E21] text-white text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                {currentExercise.isUnilateral && currentSide === 'left'
                  ? `完成左侧 (${repDraft} ${currentExercise.unit}) · 切右侧`
                  : isLastExInRound && isLastRound
                  ? `完成收官组 · 记 ${repDraft} ${currentExercise.unit}`
                  : `完成本动作 · 记 ${repDraft} ${currentExercise.unit}`}
              </span>
            </button>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={goToPrevExercise}
                disabled={!prevExercisePreview}
                className="min-h-[38px] rounded-[4px] bg-[#181B20] border border-[#252931] flex items-center justify-center gap-1 text-[12px] font-medium text-[#C8D0DC] disabled:opacity-30 hover:text-white whitespace-nowrap cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>上一动作</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="min-h-[38px] rounded-[4px] bg-[#181B20] border border-[#252931] flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#C8D0DC] hover:text-white whitespace-nowrap cursor-pointer"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? '继续' : '暂停'}</span>
              </button>
              <button
                type="button"
                onClick={skipCurrentExercise}
                className="min-h-[38px] rounded-[4px] bg-[#181B20] border border-[#252931] flex items-center justify-center gap-1 text-[12px] font-medium text-[#C8D0DC] hover:text-white whitespace-nowrap cursor-pointer"
              >
                <span>跳过</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {phase === 'setComplete' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            {latestLogged ? (
              <>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="font-precision-mono text-[11px] text-[#E05A2B]">
                      {restKind === 'round' ? `ROUND ${currentRound} LOGGED` : 'SET LOGGED'}
                      {autoAdvancePaused ? ' · PAUSED' : ` · ${setCompleteAutoSec}s`}
                    </div>
                    <div className="text-[16px] font-bold text-[#F0F2F5] font-precision-mono mt-0.5 truncate">
                      {latestLogged.exerciseName} · {latestLogged.actualReps} {latestLogged.unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateLatestSetReps(-1)}
                      className="h-10 w-10 rounded-[4px] bg-[#181B20] border border-[#2C313A] text-[#F0F2F5] font-precision-mono text-[16px] cursor-pointer"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLatestSetReps(1)}
                      className="h-10 w-10 rounded-[4px] bg-[#181B20] border border-[#2C313A] text-[#F0F2F5] font-precision-mono text-[16px] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {(['轻松', '正好', '吃力'] as EffortLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => updateLatestSetEffort(lvl)}
                      className={`h-10 rounded-[4px] text-[12.5px] font-semibold border transition-colors cursor-pointer ${
                        latestLogged.effort === lvl
                          ? 'bg-[#F0F2F5] text-[#111316] border-[#F0F2F5]'
                          : 'bg-[#181B20] text-[#8E96A3] border-[#252931]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goToRestNow}
                  className="w-full h-[50px] rounded-[6px] bg-[#E05A2B] text-white text-[14.5px] font-semibold font-precision-mono cursor-pointer"
                >
                  进入休息计时 ({restRemaining}s)
                </button>
              </>
            ) : (
              <div className="space-y-3 text-center">
                <div className="text-[12.5px] text-[#8E96A3]">
                  尚未记录完成组，请先在动作进行中点击「完成本动作」
                </div>
                <button
                  type="button"
                  onClick={() => setPhase('active')}
                  className="w-full h-11 rounded-[6px] bg-[#E05A2B] text-white text-[14px] font-semibold cursor-pointer"
                >
                  返回动作跟练
                </button>
              </div>
            )}
          </motion.div>
        )}

        {phase === 'rest' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustActiveRest(-15)}
              className="h-[50px] px-4 rounded-[6px] bg-[#181B20] border border-[#2C313A] text-[13.5px] font-precision-mono font-medium text-[#F0F2F5] hover:border-[#59606B] whitespace-nowrap cursor-pointer"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => adjustActiveRest(15)}
              className="h-[50px] px-4 rounded-[6px] bg-[#181B20] border border-[#2C313A] text-[13.5px] font-precision-mono font-medium text-[#F0F2F5] hover:border-[#59606B] whitespace-nowrap cursor-pointer"
            >
              +15s
            </button>
            <button
              type="button"
              onClick={skipRestToNext}
              className="flex-1 h-[50px] rounded-[6px] bg-[#E05A2B] text-white text-[14.5px] font-semibold whitespace-nowrap cursor-pointer"
            >
              {restWaitingManual ? '开始下一动作' : '提前结束休息'}
            </button>
          </div>
        )}

        {phase === 'nextTransition' && (
          <button
            type="button"
            onClick={startNextImmediately}
            className="w-full h-[52px] rounded-[6px] bg-[#E05A2B] text-white text-[15px] font-semibold cursor-pointer"
          >
            立即开练（{currentExercise.targetReps} {currentExercise.unit}）
          </button>
        )}
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-40 bg-[#0D0F12]/94 flex flex-col items-center justify-center px-6 text-center">
          <div className="font-precision-mono text-[11px] tracking-[0.1em] text-[#E05A2B]">
            PAUSED · {pausedSeconds}s
          </div>
          <h2 className="mt-2 text-[24px] font-bold text-[#F0F2F5]">
            暂不记录完成，也不跳过动作
          </h2>
          <p className="mt-2 text-[13px] text-[#8E96A3]">
            第 {currentRound}/{plan.rounds} 轮 · {currentExercise.name}
          </p>
          <div className="mt-7 w-full space-y-2.5">
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="w-full h-[52px] rounded-[6px] bg-[#E05A2B] text-white text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>继续跟练</span>
            </button>
            <button
              type="button"
              onClick={exitWorkoutEarly}
              className="w-full h-[46px] rounded-[6px] bg-[#181B20] border border-[#2C313A] text-[13.5px] font-medium text-[#F0F2F5] cursor-pointer"
            >
              提前结束训练（已录 {loggedSets.length} 组）
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 bg-black/75 flex flex-col justify-end">
          <div className={`bg-[#181B20] border-t border-[#2C313A] p-5 ${bottomSafePad}`}>
            <h3 className="text-[17px] font-bold text-[#F0F2F5]">确认终止本次跟练？</h3>
            <p className="mt-1.5 text-[13px] text-[#8E96A3] leading-relaxed">
              {loggedSets.length === 0
                ? '尚未记录任何完成组，退出将标记为「提前结束（完成 0 组）」。'
                : `已实录 ${loggedSets.length} 组，退出将保存实录但计为「提前结束（部分完成）」。`}
            </p>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full h-12 rounded-[6px] bg-[#E05A2B] text-white text-[14.5px] font-semibold cursor-pointer"
              >
                继续当前训练
              </button>
              <button
                type="button"
                onClick={exitWorkoutEarly}
                className="w-full h-11 rounded-[6px] bg-[#111316] border border-[#2C313A] text-[#F0F2F5] text-[13.5px] font-medium cursor-pointer"
              >
                提前结束并查看日志
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
