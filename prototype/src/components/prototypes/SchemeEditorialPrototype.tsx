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

interface SchemeEditorialPrototypeProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
}

/**
 * 方向 A · 高级运动品牌（Editorial Athletic Brand）
 * 温暖矿物纸（#F4F1EA）+ 深森林苔绿（#2B3D30）+ 温暖暮色恢复态（#1B1917）
 * Fraunces + Noto Serif SC 衬线排印搭配 Plus Jakarta Sans 清晰功能体，去霓虹、去毛玻璃胶囊
 */
export const SchemeEditorialPrototype: React.FC<SchemeEditorialPrototypeProps> = ({
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
    'editorial',
    plan.exercises[0].id,
    plan.exercises[0].verticalImageUrl ?? plan.exercises[0].imageUrl
  );

  // 1. 今日训练（暖矿物纸编辑式编排）
  if (phase === 'today') {
    return (
      <div className="font-editorial-sans relative flex h-full flex-col bg-[#F4F1EA] text-[#191816]">
        {/* Top Meta Bar */}
        <div
          className={`${topSafePad} px-5 pb-2.5 flex items-center justify-between border-b border-[#DDD6C9] shrink-0`}
        >
          <div className="text-[12px] tracking-[0.04em] text-[#646158]">
            周六 · 弹性训练日
          </div>
          <button
            type="button"
            onClick={() => setShowSwapDrawer(true)}
            className="min-h-[38px] px-1 flex items-center gap-1.5 text-[12.5px] font-medium text-[#191816] hover:text-[#2B3D30] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>调整或顺延</span>
          </button>
        </div>

        {/* Underline Category Tabs（去胶囊化，克制下划线） */}
        <div className="px-5 flex items-center gap-5 border-b border-[#DDD6C9] overflow-x-auto iphone-scroll shrink-0">
          {WORKOUT_OPTIONS.map((opt, idx) => {
            const active = planIndex === idx && !postponedNote;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => selectPlan(idx)}
                className={`relative py-3 text-[13px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'font-semibold text-[#191816]'
                    : 'font-normal text-[#7B766B] hover:text-[#191816]'
                }`}
              >
                {opt.category}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2B3D30]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Editorial Body */}
        <div className="iphone-scroll flex-1 overflow-y-auto pb-6">
          {postponedNote ? (
            <div className="mx-5 mt-5 border border-[#DDD6C9] bg-[#ECE8DF]/70 rounded-[8px] p-6">
              <div className="text-[12px] tracking-[0.06em] text-[#9A4D33] font-medium">
                弹性周期 · 今日留白
              </div>
              <h2 className="font-editorial-serif mt-2 text-[25px] font-medium leading-snug text-[#191816]">
                今天顺延，留出恢复空间
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[#5C5951]">
                已顺延「{plan.title}」。规律而不苛求的节律，比盲目硬撑更容易塑造持久的身材线条。
              </p>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setPostponedNote(false)}
                  className="flex-1 h-11 rounded-[6px] bg-[#2B3D30] text-[#F4F1EA] text-[13.5px] font-medium cursor-pointer"
                >
                  恢复今日训练
                </button>
                <button
                  type="button"
                  onClick={() => selectPlan(3)}
                  className="px-4 h-11 rounded-[6px] border border-[#C8C1B2] text-[#191816] text-[13.5px] font-medium cursor-pointer"
                >
                  改做恢复日
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Lookbook Photo Plate + Unboxed Editorial Title Below (No muddying text over photo) */}
              <div className="px-5 pt-4">
                <div
                  className={`relative overflow-hidden rounded-[8px] bg-[#E5E0D5] ${
                    isSE ? 'h-[150px]' : 'h-[184px]'
                  }`}
                >
                  {heroImage && (
                    <img
                      src={heroImage}
                      alt={plan.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-[50%_38%]"
                    />
                  )}
                </div>

                <div className="mt-4 pb-4 border-b border-[#DDD6C9]">
                  <div className="text-[11.5px] tracking-[0.04em] text-[#646158]">
                    {plan.scheduleContext}
                  </div>
                  <h1 className="font-editorial-serif mt-1.5 text-[24px] font-medium leading-[1.2] tracking-[-0.015em] text-[#191816]">
                    {plan.title}
                  </h1>
                  <div className="mt-2 flex items-center gap-2 text-[12.5px] text-[#5B584F] tabular-nums">
                    <span>{plan.estimatedMinutesRange}</span>
                    <span aria-hidden="true">·</span>
                    <span>{plan.rounds} 轮循环</span>
                    <span aria-hidden="true">·</span>
                    <span>{plan.exercises.length} 动作/轮</span>
                  </div>
                </div>
              </div>

              {/* Load / Plate Configuration */}
              {activePlate ? (
                <div className="mx-5 py-4 border-b border-[#DDD6C9]">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[13px] font-semibold text-[#191816]">
                      哑铃配重（待确认示例）
                    </span>
                    <span className="text-[11.5px] text-[#7B766B] tabular-nums">
                      库存在手 29kg
                    </span>
                  </div>

                  <div className="rounded-[6px] bg-[#ECE8DF] border border-[#DDD6C9] px-3.5 py-2.5 space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                      <span className="text-[#646158] shrink-0">单只装片</span>
                      <span className="font-medium text-[#191816] text-right tabular-nums">
                        {activePlate.platesPerSideKg.length > 0
                          ? `每侧 ${activePlate.platesPerSideKg.join('+')} kg（片重 ${activePlate.plateSumPerDumbbellKg} kg + 未知杆）`
                          : '仅空杆 + 锁扣（未装片）'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 text-[11.5px] text-[#646158]">
                      <span className="shrink-0">库存占用</span>
                      <span className="text-right tabular-nums">{activePlate.inventoryUsage}</span>
                    </div>
                    {activePlate.cautionNote && (
                      <div className="text-[11.5px] text-[#9A4D33] pt-0.5">
                        提示：{activePlate.cautionNote}
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-start gap-1.5 text-[11.5px] text-[#9A4D33] leading-snug">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{USER_CONTEXT.safetyDisclaimer}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 overflow-x-auto iphone-scroll pb-0.5">
                    {PLATE_PRESETS.map((preset) => {
                      const isSel = preset.id === activePlate.id;
                      const isHigh = preset.plateSumPerDumbbellKg >= 11.5;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => selectPlatePreset(preset)}
                          className={`min-h-[34px] px-2.5 rounded-[5px] text-[12px] tabular-nums font-medium whitespace-nowrap shrink-0 transition-colors border cursor-pointer ${
                            isSel
                              ? isHigh
                                ? 'bg-[#9A4D33] text-[#F4F1EA] border-[#9A4D33]'
                                : 'bg-[#2B3D30] text-[#F4F1EA] border-[#2B3D30]'
                              : 'bg-transparent text-[#5B584F] border-[#D5CFC2] hover:border-[#191816] hover:text-[#191816]'
                          }`}
                        >
                          {preset.plateSumPerDumbbellKg === 0
                            ? '仅空杆'
                            : `${preset.plateSumPerDumbbellKg}kg片`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mx-5 py-4 border-b border-[#DDD6C9]">
                  <div className="text-[12px] text-[#646158]">器械环境</div>
                  <div className="mt-1 text-[14px] font-medium text-[#191816]">
                    徒手无器械 · 仅需瑜伽垫
                  </div>
                </div>
              )}

              {/* Rest Rhythm */}
              <div className="mx-5 py-4 border-b border-[#DDD6C9]">
                <div className="flex items-baseline justify-between mb-2.5">
                  <span className="text-[13px] font-semibold text-[#191816]">休息节律</span>
                  <span className="text-[12px] text-[#2B3D30] font-medium tabular-nums">
                    动作间 {customRestSeconds}s · 轮间 {customRoundRestSeconds}s
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
                        className={`min-h-[36px] rounded-[5px] text-[12.5px] tabular-nums font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#191816] text-[#F4F1EA] border-[#191816]'
                            : 'bg-transparent text-[#5B584F] border-[#D5CFC2] hover:border-[#191816]'
                        }`}
                      >
                        {sec}s
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[12px]">
                  <span className="text-[#646158]">倒计时归零后</span>
                  <button
                    type="button"
                    onClick={() => setRestAutoAdvance(!restAutoAdvance)}
                    className="min-h-[32px] px-2.5 rounded-[5px] border border-[#D5CFC2] text-[#191816] font-medium hover:border-[#191816] transition-colors cursor-pointer"
                  >
                    {restAutoAdvance ? '自动进入下一动作' : '等待手动确认'}
                  </button>
                </div>
              </div>

              {/* Exercise Sequence Ledger */}
              <div className="px-5 pt-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[13px] font-semibold text-[#191816]">
                    单轮顺序（{plan.exercises.length} 动作）
                  </span>
                  <span className="text-[12px] text-[#646158] tabular-nums">
                    共 {plan.rounds} 轮 · {totalSetsPerSession} 组
                  </span>
                </div>

                <div className="divide-y divide-[#DDD6C9]">
                  {plan.exercises.map((ex, idx) => (
                    <div key={ex.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="flex items-baseline gap-3.5 min-w-0">
                        <span className="font-editorial-serif text-[15px] text-[#7B766B] tabular-nums shrink-0">
                          0{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[14.5px] font-semibold text-[#191816] truncate">
                            {ex.name}
                          </div>
                          <div className="mt-0.5 text-[12px] text-[#646158] truncate">
                            {ex.muscleGroup} · {ex.targetMuscle} · 节奏 {ex.tempo}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#8B8578] truncate">
                            {ex.isUnilateral ? '单臂左右各 1 组 · ' : ''}
                            {ex.videoUrl ? '含示范视频' : '静态姿态参考'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pt-0.5 tabular-nums">
                        <div className="text-[14px] font-semibold text-[#191816]">
                          {ex.targetReps} {ex.unit}
                        </div>
                        <div className="text-[11.5px] text-[#646158] mt-0.5">
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

        {/* Clean Non-Overlapping Architectural Action Band */}
        {!postponedNote && (
          <div
            className={`shrink-0 bg-[#F4F1EA] border-t border-[#DDD6C9] px-5 pt-3.5 ${bottomSafePad}`}
          >
            <button
              type="button"
              onClick={startPreparation}
              className="w-full h-[52px] rounded-[8px] bg-[#2B3D30] hover:bg-[#223127] text-[#F4F1EA] text-[15px] font-semibold tracking-[0.01em] flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>开始今日跟练</span>
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        )}

        {/* Swap Drawer */}
        {showSwapDrawer && (
          <div className="absolute inset-0 z-40 bg-[#191816]/45 backdrop-blur-[2px] flex flex-col justify-end">
            <div className={`bg-[#F4F1EA] border-t border-[#DDD6C9] p-5 ${bottomSafePad}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-editorial-serif text-[18px] font-medium text-[#191816]">
                  调整今日训练计划
                </span>
                <button
                  type="button"
                  onClick={() => setShowSwapDrawer(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#646158] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {WORKOUT_OPTIONS.map((opt, idx) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectPlan(idx)}
                    className={`w-full text-left p-3.5 rounded-[6px] border transition-colors cursor-pointer ${
                      planIndex === idx
                        ? 'bg-[#2B3D30] text-[#F4F1EA] border-[#2B3D30]'
                        : 'bg-[#ECE8DF]/70 text-[#191816] border-[#DDD6C9]'
                    }`}
                  >
                    <div className="text-[13.5px] font-semibold">
                      {opt.category} · {opt.title}
                    </div>
                    <div
                      className={`text-[12px] mt-0.5 tabular-nums ${
                        planIndex === idx ? 'text-[#D3DDD5]' : 'text-[#646158]'
                      }`}
                    >
                      {opt.estimatedMinutesRange} · 默认休息 {opt.defaultRestSeconds}s
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
                className="mt-3 w-full h-11 rounded-[6px] border border-[#C8C1B2] text-[13.5px] font-medium text-[#191816] cursor-pointer"
              >
                今天状态一般，顺延至下次
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 7. 训练完成总结（回归暖矿物纸，与首页一脉相承的清晰账本结构）
  if (phase === 'summary') {
    const isCompleted = sessionOutcome === 'completed';
    const isZeroExit = sessionOutcome === 'early_exit_zero';
    const totalActualReps = loggedSets.reduce((sum, s) => sum + s.actualReps, 0);

    return (
      <div className="font-editorial-sans relative flex h-full flex-col bg-[#F4F1EA] text-[#191816]">
        <div className={`iphone-scroll flex-1 overflow-y-auto px-5 pb-28 ${topSafePad}`}>
          <div
            className={`text-[12px] font-medium tracking-[0.04em] ${
              isCompleted
                ? 'text-[#2B3D30]'
                : isZeroExit
                ? 'text-[#9A4D33]'
                : 'text-[#646158]'
            }`}
          >
            {isCompleted
              ? '今日训练 · 完整完成'
              : isZeroExit
              ? '提前结束 · 完成 0 组'
              : '提前结束 · 部分完成'}
          </div>
          <h1 className="font-editorial-serif mt-1.5 text-[27px] font-medium leading-tight text-[#191816]">
            {isCompleted
              ? '按节律完成全部轮次'
              : isZeroExit
              ? '未计入完整课程完成次数'
              : '已保留实际记录'}
          </h1>
          <p className="mt-1.5 text-[12px] text-[#646158] tabular-nums">
            {sessionStartedAt || '--:--:--'} → {sessionEndedAt || '--:--:--'} · 暂停 {pausedSeconds}s
          </p>

          {/* 3-Column Editorial Ledger */}
          <div className="mt-5 grid grid-cols-3 border-y border-[#DDD6C9] py-4 divide-x divide-[#DDD6C9]">
            <div className="pr-3">
              <div className="font-editorial-serif text-[28px] font-medium leading-none text-[#191816] tabular-nums">
                {loggedSets.length}
              </div>
              <div className="text-[11.5px] text-[#646158] mt-1.5">实录完成组</div>
            </div>
            <div className="px-3">
              <div className="font-editorial-serif text-[28px] font-medium leading-none text-[#191816] tabular-nums">
                {totalActualReps}
              </div>
              <div className="text-[11.5px] text-[#646158] mt-1.5">实录总次数</div>
            </div>
            <div className="pl-3">
              <div className="font-editorial-serif text-[28px] font-medium leading-none text-[#2B3D30] tabular-nums">
                {formatTimeMMSS(elapsedSeconds)}
              </div>
              <div className="text-[11.5px] text-[#646158] mt-1.5">有效时长</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[13px] font-semibold text-[#191816] mb-2">
              逐组实录明细（{loggedSets.length} 组）
            </div>
            {loggedSets.length === 0 ? (
              <div className="rounded-[6px] bg-[#ECE8DF] border border-[#DDD6C9] p-4 text-[13px] text-[#5C5951] leading-relaxed">
                本次尚未记录任何完成组，系统不会伪造数据，也不会计入完整课程完成次数。
              </div>
            ) : (
              <div className="divide-y divide-[#DDD6C9]">
                {loggedSets.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-2 text-[12px]"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-[#191816] truncate">
                        R{item.round} · {item.exerciseName}
                        {item.side === 'left' ? '（左）' : item.side === 'right' ? '（右）' : ''}
                      </div>
                      <div className="text-[#646158] mt-0.5 tabular-nums">
                        {item.weightUsed} · 实休 {item.actualRestSeconds}s
                      </div>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <div className="font-semibold text-[#2B3D30]">
                        {item.actualReps}/{item.targetReps} {item.unit}
                      </div>
                      <div className="text-[#646158]">{item.effort}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {skippedRecords.length > 0 && (
            <div className="mt-5">
              <div className="text-[12.5px] font-semibold text-[#9A4D33] mb-2">
                跳过动作（{skippedRecords.length} 项 · 未计为完成）
              </div>
              <div className="divide-y divide-[#DDD6C9] border-t border-[#DDD6C9]">
                {skippedRecords.map((sk, idx) => (
                  <div
                    key={`${sk.timestamp}-${idx}`}
                    className="py-2 text-[12px] text-[#646158] flex items-center justify-between"
                  >
                    <span>
                      R{sk.round} · {sk.exerciseName}
                    </span>
                    <span className="tabular-nums text-[11px]">{sk.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className={`shrink-0 bg-[#F4F1EA] border-t border-[#DDD6C9] px-5 pt-3.5 ${bottomSafePad}`}
        >
          <button
            type="button"
            onClick={() => selectPlan(planIndex)}
            className="w-full h-[52px] rounded-[8px] bg-[#2B3D30] text-[#F4F1EA] text-[15px] font-semibold cursor-pointer"
          >
            完成并回到今日训练
          </button>
        </div>
      </div>
    );
  }

  // 2–6. 动作舞台 / 休息 / 过渡（统一自然光全屏舞台 + 暖暮色恢复态）
  const latestLogged = loggedSets[loggedSets.length - 1];
  const hasRealVideo = Boolean(activeVideoUrl) && !videoLoadFailed;
  const stagePhoto = getDirectionExerciseVisual(
    'editorial',
    currentExercise.id,
    currentExercise.hasVerifiedPoseImage
      ? currentExercise.verticalImageUrl ?? currentExercise.imageUrl
      : undefined
  );
  const nextPhoto = nextExerciseAfterRest
    ? getDirectionExerciseVisual(
        'editorial',
        nextExerciseAfterRest.id,
        nextExerciseAfterRest.imageUrl
      )
    : undefined;

  const isDuskMode = phase === 'rest' || phase === 'prepare' || phase === 'nextTransition';
  const isFinal3Sec = phase === 'rest' && restRemaining <= 3 && restRemaining > 0;
  const restRatio = Math.max(0, Math.min(1, restRemaining / Math.max(1, restTargetTotal)));
  const repsModified = repDraft !== currentExercise.targetReps;

  return (
    <div
      className={`font-editorial-sans relative flex h-full flex-col overflow-hidden transition-colors duration-300 ${
        isDuskMode ? 'bg-[#1B1917] text-[#F4F1EA]' : 'bg-[#F4F1EA] text-[#191816]'
      }`}
    >
      {/* Full-bleed Studio Media Area */}
      <div className="relative flex-1 overflow-hidden">
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
                ? 'opacity-15 grayscale-[40%] scale-[1.02]'
                : phase === 'prepare' || phase === 'nextTransition'
                ? 'opacity-30 scale-[1.01]'
                : phase === 'setComplete'
                ? 'brightness-[0.82]'
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
                ? 'opacity-15 grayscale-[35%] scale-[1.02]'
                : phase === 'prepare' || phase === 'nextTransition'
                ? 'opacity-28 scale-[1.01]'
                : phase === 'setComplete'
                ? 'brightness-[0.85]'
                : 'opacity-100'
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#ECE8DF] px-8 text-center">
            <Film className="w-6 h-6 text-[#7B766B] mb-3" />
            <div className="text-[14px] font-medium text-[#191816]">暂无动作示范视频</div>
            <div className="mt-1 text-[12px] text-[#646158] max-w-[230px] leading-relaxed">
              请根据下方动作要领按自身呼吸节律完成
            </div>
          </div>
        )}

        {/* Top atmospheric veil matching studio plaster (light in active, warm espresso in rest/prep) */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-36 transition-opacity duration-300 ${
            isDuskMode
              ? 'bg-gradient-to-b from-[#1B1917]/90 via-[#1B1917]/45 to-transparent'
              : 'bg-gradient-to-b from-[#F4F1EA]/92 via-[#F4F1EA]/55 to-transparent'
          }`}
        />

        {/* Soft bottom transition into architectural action band during active */}
        {!isDuskMode && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#F4F1EA] via-[#F4F1EA]/65 to-transparent" />
        )}

        {/* Top Safe Area Header */}
        <div className={`relative z-20 ${topSafePad} px-5`}>
          {/* Crisp 2px Architectural Hairline Progress */}
          <div
            className="grid gap-1.5 mb-2.5"
            style={{ gridTemplateColumns: `repeat(${totalExercisesInRound}, minmax(0, 1fr))` }}
          >
            {plan.exercises.map((ex, idx) => {
              const done = idx < exerciseIdx;
              const curr = idx === exerciseIdx;
              return (
                <div
                  key={ex.id}
                  className={`h-[2px] transition-colors ${
                    isDuskMode
                      ? done
                        ? 'bg-[#EAE5DA]'
                        : curr
                        ? 'bg-white'
                        : 'bg-white/20'
                      : done
                      ? 'bg-[#2B3D30]'
                      : curr
                      ? 'bg-[#191816]'
                      : 'bg-[#191816]/18'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className={`min-h-[38px] pr-2 flex items-center gap-1 text-[12.5px] font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                isDuskMode ? 'text-[#F4F1EA]/85' : 'text-[#191816]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>退出</span>
            </button>

            <div
              className={`text-[12px] font-medium tabular-nums whitespace-nowrap truncate ${
                isDuskMode ? 'text-[#F4F1EA]/90' : 'text-[#191816]'
              }`}
            >
              <span>第 {currentRound}/{plan.rounds} 轮</span>
              <span className="mx-1.5 opacity-40" aria-hidden="true">·</span>
              <span>动作 {exerciseIdx + 1}/{totalExercisesInRound}</span>
              <span className="mx-1.5 opacity-40" aria-hidden="true">·</span>
              <span>{formatTimeMMSS(elapsedSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`min-h-[38px] min-w-[38px] flex items-center justify-end shrink-0 cursor-pointer ${
                isDuskMode
                  ? soundEnabled
                    ? 'text-[#F4F1EA]'
                    : 'text-[#F4F1EA]/45'
                  : soundEnabled
                  ? 'text-[#2B3D30]'
                  : 'text-[#7B766B]'
              }`}
              aria-label="语音与提示音开关"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {(phase === 'active' || phase === 'prepare') && (
            <div
              className={`mt-1 flex items-center justify-between gap-2 text-[11px] ${
                isDuskMode ? 'text-[#F4F1EA]/65' : 'text-[#5B584F]'
              }`}
            >
              <span className="truncate">
                {hasRealVideo
                  ? '示范视频循环中 · 按自身节奏完成（不锁速）'
                  : '姿态参考画面 · 按自身呼吸节奏完成'}
              </span>
              {isDebugPreviewMode && (
                <span className="shrink-0 font-medium text-[#9A4D33]">[预览直达]</span>
              )}
            </div>
          )}
        </div>

        {/* Center Dusk Stage for Prepare / Rest / Next Transition */}
        {isDuskMode && (
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 pb-20">
            <AnimatePresence mode="wait">
              {phase === 'prepare' && (
                <motion.div
                  key="ed-prepare"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="text-[12px] tracking-[0.08em] text-[#B8B1A3]">
                    准备就位 · 调整呼吸
                  </div>
                  <h2 className="font-editorial-serif mt-2 text-[28px] font-medium text-[#F4F1EA]">
                    {currentExercise.name}
                  </h2>
                  <div className="font-editorial-serif my-5 text-[82px] font-normal leading-none text-[#F4F1EA] tabular-nums">
                    {prepareRemaining}
                  </div>
                  <p className="text-[13px] text-[#C8C2B6] max-w-[260px] mx-auto leading-relaxed">
                    {currentExercise.nextPrepCue}
                  </p>
                </motion.div>
              )}

              {phase === 'rest' && (
                <motion.div
                  key="ed-rest"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col items-center text-center w-full"
                >
                  {!restTriggeredBySet && loggedSets.length === 0 && (
                    <div className="mb-3 text-[11.5px] text-[#D79476]">
                      休息预览态 · 未计入完成组
                    </div>
                  )}

                  <div
                    className={`text-[12.5px] tracking-[0.06em] ${
                      isFinal3Sec || restWaitingManual ? 'text-[#E39D7E]' : 'text-[#A8A295]'
                    }`}
                  >
                    {restWaitingManual
                      ? '恢复时间已到 · 随时继续'
                      : restKind === 'round'
                      ? `第 ${currentRound} 轮已完成 · 轮间深呼吸`
                      : '组间安静恢复'}
                  </div>

                  {/* Quiet Editorial Serif Countdown (No heavy circle, no shouting bold) */}
                  <div
                    className={`font-editorial-serif mt-3 font-normal leading-none tracking-[-0.03em] tabular-nums transition-colors duration-300 ${
                      isSE ? 'text-[72px]' : 'text-[86px]'
                    } ${isFinal3Sec ? 'text-[#E39D7E]' : 'text-[#F4F1EA]'}`}
                  >
                    {formatTimeMMSS(restRemaining)}
                  </div>

                  {/* 1.5px Hairline Progress */}
                  <div className="mt-5 w-full max-w-[220px] h-[1.5px] bg-white/15 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isFinal3Sec || restWaitingManual ? 'bg-[#E39D7E]' : 'bg-[#F4F1EA]/80'
                      }`}
                      style={{ width: `${restRatio * 100}%` }}
                    />
                  </div>

                  <div className="mt-2.5 text-[11.5px] text-[#A8A295] tabular-nums flex items-center gap-2">
                    <span>实休 {actualRestElapsed}s</span>
                    <span aria-hidden="true">·</span>
                    <span>目标 {restTargetTotal}s</span>
                  </div>

                  {/* Next Up Editorial Strip */}
                  {nextExerciseAfterRest && (
                    <div className="mt-8 w-full max-w-[310px] border-t border-b border-white/12 py-3 flex items-center gap-3 text-left">
                      {nextPhoto && (
                        <img
                          src={nextPhoto}
                          alt={nextExerciseAfterRest.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-[4px] object-cover shrink-0 bg-[#2A2723]"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-[#A8A295] tabular-nums truncate">
                          即将开始 · {nextExerciseAfterRest.targetReps} {nextExerciseAfterRest.unit}
                          {nextExerciseAfterRest.isUnilateral ? '（单臂左右）' : ''}
                        </div>
                        <div className="font-editorial-serif text-[15px] font-medium text-[#F4F1EA] truncate mt-0.5">
                          {nextExerciseAfterRest.name}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {phase === 'nextTransition' && (
                <motion.div
                  key="ed-next"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-center max-w-[310px]"
                >
                  <div className="text-[12px] tracking-[0.06em] text-[#B8B1A3]">
                    {exerciseIdx === 0 && currentRound > 1
                      ? `开启第 ${currentRound} 轮`
                      : `下一动作 · ${exerciseIdx + 1}/${totalExercisesInRound}`}
                  </div>
                  <h2 className="font-editorial-serif mt-2 text-[30px] font-medium leading-tight text-[#F4F1EA]">
                    {currentExercise.name}
                  </h2>
                  <div className="mt-2 text-[12.5px] text-[#C8C2B6] tabular-nums">
                    {currentExercise.muscleGroup} · {getExerciseWeightLabel(currentExercise.usesDumbbells)} ·{' '}
                    {currentExercise.targetReps} {currentExercise.unit}
                  </div>
                  <p className="mt-2.5 text-[13px] text-[#EAE5DA]/85 leading-relaxed">
                    {currentExercise.nextPrepCue}
                  </p>
                  <div className="font-editorial-serif mt-5 text-[52px] font-normal leading-none text-[#F4F1EA] tabular-nums">
                    {transitionSec}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom Architectural Action Surface */}
      <div
        className={`relative z-20 px-5 pt-2 ${bottomSafePad} ${
          isDuskMode
            ? 'bg-[#1B1917] border-t border-white/10 pt-3.5'
            : 'bg-[#F4F1EA] border-t border-[#DDD6C9] pt-3'
        }`}
      >
        {phase === 'prepare' && (
          <button
            type="button"
            onClick={skipPreparation}
            className="w-full h-[52px] rounded-[8px] bg-[#F4F1EA] text-[#191816] text-[15px] font-semibold cursor-pointer active:scale-[0.99] transition-transform"
          >
            我已就位，开始跟练
          </button>
        )}

        {phase === 'active' && (
          <div>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                {currentExercise.isUnilateral && (
                  <div className="mb-2 inline-flex items-center border border-[#D3CDC0] rounded-[5px] overflow-hidden bg-[#ECE8DF]">
                    <button
                      type="button"
                      onClick={() => setCurrentSide('left')}
                      className={`min-h-[28px] px-2.5 text-[11.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        currentSide === 'left'
                          ? 'bg-[#2B3D30] text-[#F4F1EA]'
                          : 'text-[#646158] hover:text-[#191816]'
                      }`}
                    >
                      左侧 {currentSide === 'right' ? '✓' : '进行中'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentSide('right')}
                      className={`min-h-[28px] px-2.5 text-[11.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        currentSide === 'right'
                          ? 'bg-[#2B3D30] text-[#F4F1EA]'
                          : 'text-[#646158] hover:text-[#191816]'
                      }`}
                    >
                      右侧
                    </button>
                  </div>
                )}

                <div className="text-[11.5px] text-[#646158] truncate tabular-nums">
                  {currentExercise.muscleGroup} · {getExerciseWeightLabel(currentExercise.usesDumbbells)} ·{' '}
                  {currentExercise.tempo}
                </div>
                <h1
                  className={`font-editorial-serif mt-0.5 font-medium leading-tight text-[#191816] truncate ${
                    isSE ? 'text-[21px]' : 'text-[24px]'
                  }`}
                >
                  {currentExercise.name}
                </h1>
                <p className="mt-1 text-[12px] text-[#5C5951] line-clamp-1">
                  {soundEnabled ? currentExercise.voiceCue : currentExercise.targetMuscle}
                </p>

                {hasRealVideo && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={replayCurrentVideo}
                      className="min-h-[30px] px-2.5 rounded-[4px] border border-[#D3CDC0] text-[11px] font-medium text-[#191816] flex items-center gap-1 whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>重播示范</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMuted(!videoMuted)}
                      className="min-h-[30px] px-2.5 rounded-[4px] border border-[#D3CDC0] text-[11px] font-medium text-[#191816] flex items-center gap-1 whitespace-nowrap cursor-pointer"
                    >
                      {videoMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      <span>{videoMuted ? '静音' : '原声'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Clean Architectural Stepper (No puffy glass card) */}
              <div className="shrink-0 flex flex-col items-center rounded-[6px] border border-[#D3CDC0] bg-[#ECE8DF] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRepDraft((r) => r + 1)}
                  className="h-9 w-12 text-[#191816] hover:bg-[#E2DDD1] text-[17px] font-medium flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="增加次数"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setRepDraft(currentExercise.targetReps)}
                  title="点击恢复目标次数"
                  className="w-12 py-1.5 border-y border-[#D3CDC0] bg-[#F4F1EA] text-center cursor-pointer"
                >
                  <div
                    className={`font-editorial-serif text-[23px] font-medium leading-none tabular-nums ${
                      repsModified ? 'text-[#9A4D33]' : 'text-[#191816]'
                    }`}
                  >
                    {repDraft}
                  </div>
                  <div className="text-[9.5px] text-[#646158] mt-0.5 tabular-nums">
                    {repsModified ? `目标 ${currentExercise.targetReps}` : currentExercise.unit}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRepDraft((r) => Math.max(1, r - 1))}
                  className="h-9 w-12 text-[#191816] hover:bg-[#E2DDD1] text-[17px] font-medium flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="减少次数"
                >
                  −
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompleteActiveSet}
              className="w-full h-[50px] rounded-[8px] bg-[#2B3D30] hover:bg-[#223127] text-[#F4F1EA] text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.2]" />
              <span>
                {currentExercise.isUnilateral && currentSide === 'left'
                  ? `完成左侧 (${repDraft} ${currentExercise.unit}) · 切右侧`
                  : isLastExInRound && isLastRound
                  ? `完成收官组 · 记 ${repDraft} ${currentExercise.unit}`
                  : `完成本动作 · 记 ${repDraft} ${currentExercise.unit}`}
              </span>
            </button>

            <div className="mt-1.5 grid grid-cols-3 items-center text-[#5B584F]">
              <button
                type="button"
                onClick={goToPrevExercise}
                disabled={!prevExercisePreview}
                className="min-h-[38px] px-2 flex items-center justify-center gap-1 text-[12px] font-medium disabled:opacity-30 hover:text-[#191816] transition-colors whitespace-nowrap cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>上一动作</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="min-h-[38px] px-2 flex items-center justify-center gap-1.5 text-[12px] font-medium hover:text-[#191816] transition-colors whitespace-nowrap cursor-pointer"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? '继续' : '暂停'}</span>
              </button>
              <button
                type="button"
                onClick={skipCurrentExercise}
                className="min-h-[38px] px-2 flex items-center justify-center gap-1 text-[12px] font-medium hover:text-[#191816] transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>跳过动作</span>
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
                    <div className="text-[11.5px] font-medium text-[#2B3D30] tabular-nums">
                      {restKind === 'round' ? `第 ${currentRound} 轮已完成` : '本组已实录'}
                      {autoAdvancePaused ? ' · 已暂停自动切休息' : ` · ${setCompleteAutoSec}s 后进入休息`}
                    </div>
                    <div className="font-editorial-serif text-[18px] font-medium text-[#191816] truncate mt-0.5 tabular-nums">
                      {latestLogged.exerciseName} · {latestLogged.actualReps} {latestLogged.unit}
                    </div>
                  </div>
                  <div className="flex items-center border border-[#D3CDC0] rounded-[6px] overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => updateLatestSetReps(-1)}
                      className="h-10 w-10 bg-[#ECE8DF] text-[#191816] text-[16px] font-medium cursor-pointer"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLatestSetReps(1)}
                      className="h-10 w-10 bg-[#ECE8DF] border-l border-[#D3CDC0] text-[#191816] text-[16px] font-medium cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(['轻松', '正好', '吃力'] as EffortLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => updateLatestSetEffort(lvl)}
                      className={`h-10 rounded-[6px] text-[13px] font-medium border transition-colors cursor-pointer ${
                        latestLogged.effort === lvl
                          ? 'bg-[#191816] text-[#F4F1EA] border-[#191816]'
                          : 'bg-transparent text-[#5B584F] border-[#D3CDC0]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goToRestNow}
                  className="w-full h-[50px] rounded-[8px] bg-[#2B3D30] text-[#F4F1EA] text-[15px] font-semibold tabular-nums cursor-pointer"
                >
                  立即进入休息（{restRemaining}s）
                </button>
              </>
            ) : (
              <div className="space-y-3 text-center">
                <div className="text-[12.5px] text-[#5C5951]">
                  尚未记录完成组，请先在动作进行中点击「完成本动作」
                </div>
                <button
                  type="button"
                  onClick={() => setPhase('active')}
                  className="w-full h-11 rounded-[8px] bg-[#2B3D30] text-[#F4F1EA] text-[14px] font-semibold cursor-pointer"
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
              className="h-[50px] px-4 rounded-[8px] border border-white/18 text-[13.5px] tabular-nums font-medium text-[#F4F1EA] hover:bg-white/8 whitespace-nowrap cursor-pointer"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => adjustActiveRest(15)}
              className="h-[50px] px-4 rounded-[8px] border border-white/18 text-[13.5px] tabular-nums font-medium text-[#F4F1EA] hover:bg-white/8 whitespace-nowrap cursor-pointer"
            >
              +15s
            </button>
            <button
              type="button"
              onClick={skipRestToNext}
              className="flex-1 h-[50px] rounded-[8px] bg-[#F4F1EA] text-[#191816] text-[14.5px] font-semibold whitespace-nowrap cursor-pointer active:scale-[0.99] transition-transform"
            >
              {restWaitingManual ? '开始下一动作' : '提前结束休息'}
            </button>
          </div>
        )}

        {phase === 'nextTransition' && (
          <button
            type="button"
            onClick={startNextImmediately}
            className="w-full h-[52px] rounded-[8px] bg-[#F4F1EA] text-[#191816] text-[15px] font-semibold cursor-pointer"
          >
            立即开练（{currentExercise.targetReps} {currentExercise.unit}）
          </button>
        )}
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-40 bg-[#1B1917]/94 flex flex-col items-center justify-center px-6 text-center text-[#F4F1EA]">
          <div className="text-[12px] tracking-[0.06em] text-[#A8A295] tabular-nums">
            训练暂停中 · 已暂停 {pausedSeconds}s
          </div>
          <h2 className="font-editorial-serif mt-2.5 text-[26px] font-medium text-[#F4F1EA]">
            暂不记录完成，也不跳过动作
          </h2>
          <p className="mt-2 text-[13px] text-[#B8B1A3]">
            第 {currentRound}/{plan.rounds} 轮 · {currentExercise.name}
          </p>
          <div className="mt-7 w-full space-y-2.5">
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="w-full h-[52px] rounded-[8px] bg-[#F4F1EA] text-[#191816] text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>继续跟练</span>
            </button>
            <button
              type="button"
              onClick={exitWorkoutEarly}
              className="w-full h-[46px] rounded-[8px] border border-white/20 text-[13.5px] font-medium text-[#F4F1EA] cursor-pointer"
            >
              提前结束训练（已录 {loggedSets.length} 组）
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 bg-[#191816]/60 backdrop-blur-[2px] flex flex-col justify-end">
          <div className={`bg-[#F4F1EA] text-[#191816] border-t border-[#DDD6C9] p-5 ${bottomSafePad}`}>
            <h3 className="font-editorial-serif text-[19px] font-medium text-[#191816]">
              确认结束本次跟练？
            </h3>
            <p className="mt-1.5 text-[13px] text-[#5C5951] leading-relaxed">
              {loggedSets.length === 0
                ? '尚未记录任何完成组，退出将标记为「提前结束（完成 0 组）」。'
                : `已实录 ${loggedSets.length} 组，退出将保存实录但计为「提前结束（部分完成）」。`}
            </p>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full h-12 rounded-[8px] bg-[#2B3D30] text-[#F4F1EA] text-[14.5px] font-semibold cursor-pointer"
              >
                继续当前训练
              </button>
              <button
                type="button"
                onClick={exitWorkoutEarly}
                className="w-full h-11 rounded-[8px] border border-[#C8C1B2] text-[#191816] text-[13.5px] font-medium cursor-pointer"
              >
                提前结束并查看总结
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
