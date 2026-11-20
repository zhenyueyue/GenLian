import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronLeft,
  Film,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatTimeMMSS, useWorkoutSimulator } from '../../hooks/useWorkoutSimulator';
import { DeviceSize, EffortLevel } from '../../types/design';
import {
  GlassButton,
  GlassDock,
  GlassIconButton,
  GlassOverlay,
  GlassPanel,
} from './WarmGlass';
import { getWarmExerciseMedia, WARM_PLAN_MEDIA, WARM_TOKENS } from './warmTokens';

interface WarmPlayerViewProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
  onFinishToArchive: () => void;
}

const EFFORT_OPTIONS: EffortLevel[] = ['轻松', '正好', '吃力'];

export const WarmPlayerView: React.FC<WarmPlayerViewProps> = ({
  sim,
  deviceSize,
  reduceMotion = false,
  onFinishToArchive,
}) => {
  const {
    phase,
    setPhase,
    isDebugPreviewMode,
    plan,
    showExitConfirm,
    setShowExitConfirm,
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
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[50px]';

  // 训练完成 / 提前结束总结页
  if (phase === 'summary') {
    const isCompleted = sessionOutcome === 'completed';
    const isZeroExit = sessionOutcome === 'early_exit_zero';
    const totalActualReps = loggedSets.reduce((acc, s) => acc + s.actualReps, 0);
    const planMedia = WARM_PLAN_MEDIA[plan.id] ?? WARM_PLAN_MEDIA['strength-a'];

    const roundsMap = new Map<number, typeof loggedSets>();
    for (const item of loggedSets) {
      const list = roundsMap.get(item.round) ?? [];
      list.push(item);
      roundsMap.set(item.round, list);
    }
    const groupedRounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0.45, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex h-full flex-col"
        style={{ backgroundColor: WARM_TOKENS.canvasBg, color: WARM_TOKENS.inkPrimary }}
      >
        <div className={`iphone-scroll flex-1 overflow-y-auto ${isSE ? 'pb-28' : 'pb-32'}`}>
          <div
            className={`relative w-full overflow-hidden ${isSE ? 'h-[245px]' : 'h-[285px]'}`}
            style={{ backgroundColor: WARM_TOKENS.surfaceBg }}
          >
            <img
              src={planMedia.wideUrl}
              alt={plan.title}
              referrerPolicy="no-referrer"
              className={`h-full w-full object-cover object-center ${
                isZeroExit ? 'grayscale opacity-65' : WARM_TOKENS.photoFilterClass
              }`}
            />
            <div
              className={`pointer-events-none absolute inset-0 ${WARM_TOKENS.photoCoolAirTintClass}`}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: WARM_TOKENS.detailHeaderOverlay }}
            />

            <div className={`absolute inset-x-0 bottom-0 px-5 pb-4 ${topSafePad}`}>
              <div
                className="text-[12px] font-semibold tracking-[0.02em]"
                style={{
                  color: isCompleted
                    ? WARM_TOKENS.accentTextOnLight
                    : isZeroExit
                    ? WARM_TOKENS.inkMuted
                    : WARM_TOKENS.warning,
                }}
              >
                {isCompleted
                  ? '今日训练完整完成'
                  : isZeroExit
                  ? '提前结束 · 完成 0 组'
                  : '提前结束 · 保留部分实录'}
              </div>
              <h1
                className="mt-1.5 font-editorial-serif text-[28px] font-semibold leading-[1.16] tracking-[-0.03em] text-balance"
                style={{ color: WARM_TOKENS.inkPrimary }}
              >
                {isCompleted
                  ? '按计划完成全部轮次'
                  : isZeroExit
                  ? '未计入完整课程完成次数'
                  : '已记下本次完成组，不影响节奏'}
              </h1>
              <div
                className="mt-2 font-mono-num text-[12px]"
                style={{ color: WARM_TOKENS.inkSecondary }}
              >
                {plan.category} · {sessionStartedAt || '--:--'} → {sessionEndedAt || '--:--'} · 暂停{' '}
                {pausedSeconds}s
              </div>
            </div>
          </div>

          <div className="px-5">
            <div
              className="grid grid-cols-3 gap-4 py-5"
              style={{
                borderTop: `1px solid ${WARM_TOKENS.hairlineBorder}`,
                borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}`,
              }}
            >
              <div>
                <div
                  className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                  style={{ color: WARM_TOKENS.inkPrimary }}
                >
                  {loggedSets.length}
                </div>
                <div className="text-[12px] mt-2" style={{ color: WARM_TOKENS.inkMuted }}>
                  完成组数
                </div>
              </div>
              <div>
                <div
                  className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                  style={{ color: WARM_TOKENS.inkPrimary }}
                >
                  {totalActualReps}
                </div>
                <div className="text-[12px] mt-2" style={{ color: WARM_TOKENS.inkMuted }}>
                  累计次数/秒
                </div>
              </div>
              <div>
                <div
                  className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                  style={{ color: WARM_TOKENS.accent }}
                >
                  {formatTimeMMSS(elapsedSeconds)}
                </div>
                <div className="text-[12px] mt-2" style={{ color: WARM_TOKENS.inkMuted }}>
                  有效时长
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-baseline justify-between mb-3">
                <span
                  className="text-[15px] font-semibold"
                  style={{ color: WARM_TOKENS.inkPrimary }}
                >
                  本次训练实录
                </span>
                <span className="font-mono-num text-[12px]" style={{ color: WARM_TOKENS.inkMuted }}>
                  共 {loggedSets.length} 组
                </span>
              </div>

              {loggedSets.length === 0 ? (
                <GlassPanel
                  variant="chip"
                  className="rounded-2xl p-4 text-[13px] leading-[1.6]"
                  style={{
                    color: WARM_TOKENS.inkSecondary,
                  }}
                >
                  本次未记录任何完成组，系统不会伪造训练容量，也不会计入完整课程完成次数。
                </GlassPanel>
              ) : (
                <div className="space-y-5">
                  {groupedRounds.map(([roundNum, items]) => (
                    <div key={roundNum}>
                      <div
                        className="text-[12px] font-semibold pb-1.5"
                        style={{
                          color: WARM_TOKENS.accentTextOnLight,
                          borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}`,
                        }}
                      >
                        第 {roundNum} 轮
                      </div>
                      <div>
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="py-3.5 flex items-center justify-between gap-3"
                            style={{ borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}` }}
                          >
                            <div className="min-w-0">
                              <div
                                className="text-[14.5px] font-semibold truncate"
                                style={{ color: WARM_TOKENS.inkPrimary }}
                              >
                                {item.exerciseName}
                                {item.side === 'left'
                                  ? ' · 左侧'
                                  : item.side === 'right'
                                  ? ' · 右侧'
                                  : ''}
                              </div>
                              <div
                                className="mt-0.5 font-mono-num text-[12px]"
                                style={{ color: WARM_TOKENS.inkMuted }}
                              >
                                {item.weightUsed} · 休息 {item.actualRestSeconds}s
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div
                                className="font-display-b text-[18px] font-semibold tabular-nums leading-tight"
                                style={{ color: WARM_TOKENS.inkPrimary }}
                              >
                                {item.actualReps}{' '}
                                <span
                                  className="text-[12px] font-normal"
                                  style={{ color: WARM_TOKENS.inkSecondary }}
                                >
                                  /{item.targetReps} {item.unit}
                                </span>
                              </div>
                              <div
                                className="text-[12px] font-medium mt-0.5"
                                style={{ color: WARM_TOKENS.auxSlate }}
                              >
                                {item.effort}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {skippedRecords.length > 0 && (
              <div className="mt-6">
                <div
                  className="text-[13px] font-semibold mb-2"
                  style={{ color: WARM_TOKENS.warning }}
                >
                  跳过动作（{skippedRecords.length} 项 · 未计为完成）
                </div>
                <div className="space-y-1.5">
                  {skippedRecords.map((sk, idx) => (
                    <GlassPanel
                      key={`${sk.timestamp}-${idx}`}
                      variant="chip"
                      className="rounded-xl px-3.5 py-2.5 text-[12.5px] flex items-center justify-between"
                      style={{
                        color: WARM_TOKENS.inkSecondary,
                      }}
                    >
                      <span>
                        第 {sk.round} 轮 · {sk.exerciseName}
                      </span>
                      <span className="font-mono-num text-[12px]">{sk.timestamp}</span>
                    </GlassPanel>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 px-4 pt-4"
          style={{
            paddingBottom: `calc(${isSE ? '16px' : '24px'} + env(safe-area-inset-bottom, 0px))`,
            background:
              'linear-gradient(180deg, rgba(244,241,235,0) 0%, rgba(244,241,235,0.08) 100%)',
          }}
        >
          <GlassDock className="pointer-events-auto">
            <button
              type="button"
              onClick={onFinishToArchive}
              className="w-full h-[48px] rounded-full text-[15px] font-semibold active:scale-[0.98] transition-all cursor-pointer"
              style={{
                backgroundColor: WARM_TOKENS.accent,
                color: WARM_TOKENS.accentContrastText,
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.34), 0 8px 20px -6px rgba(194,65,12,0.55)',
              }}
            >
              收入个人训练档案
            </button>
          </GlassDock>
        </div>
      </motion.div>
    );
  }

  const hasRealVideo = Boolean(activeVideoUrl) && !videoLoadFailed;
  const exerciseMedia = getWarmExerciseMedia(currentExercise);
  const latestLogged = loggedSets[loggedSets.length - 1];
  const restProgressPct =
    restTargetTotal > 0 ? Math.max(0, Math.min(1, restRemaining / restTargetTotal)) : 0;
  const repsModified = repDraft !== currentExercise.targetReps;

  const isActivePhase = phase === 'active';
  const isPreparePhase = phase === 'prepare';
  const isSetCompletePhase = phase === 'setComplete';
  const isRestPhase = phase === 'rest';
  const isNextTransitionPhase = phase === 'nextTransition';

  const isDimmedStage =
    isRestPhase || isPreparePhase || isNextTransitionPhase || isSetCompletePhase;

  const mediaToneClass = isRestPhase
    ? WARM_TOKENS.restDimFilterClass
    : isSetCompletePhase
    ? 'scale-[1.015] brightness-[0.74] saturate-[0.84]'
    : isPreparePhase || isNextTransitionPhase
    ? 'scale-[1.01] brightness-[0.76] saturate-[0.86]'
    : WARM_TOKENS.photoFilterClass;

  const nextRestAsset = nextExerciseAfterRest
    ? getWarmExerciseMedia(nextExerciseAfterRest)
    : null;

  const restContextLabel =
    plan.id === 'cardio'
      ? restKind === 'round'
        ? `第 ${currentRound} 轮已完成 · 间歇恢复`
        : '有氧训练间歇'
      : plan.id === 'recovery'
      ? restKind === 'round'
        ? `第 ${currentRound} 轮已完成 · 舒展过渡`
        : '舒展间歇 · 深慢呼吸'
      : restKind === 'round'
      ? `第 ${currentRound} 轮已完成 · 轮间恢复`
      : '组间安静恢复';

  const topMetaColor = isDimmedStage ? WARM_TOKENS.restTextPrimary : WARM_TOKENS.inkPrimary;
  const topSubHintColor = isDimmedStage
    ? WARM_TOKENS.restTextSecondary
    : WARM_TOKENS.inkPrimary;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0.75 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0.45 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full flex-col overflow-hidden"
      style={{ backgroundColor: WARM_TOKENS.surfaceBackdropStudio }}
    >
      {/* Layer 0: 全屏晨光运动舞台（完整展现动作，休息时 500ms 平滑压暗，不黑成一片） */}
      <motion.div
        layoutId={reduceMotion ? undefined : 'warm-perf-stage-media'}
        transition={{ duration: reduceMotion ? 0.01 : 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 overflow-hidden"
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={`${currentExercise.id}-${hasRealVideo ? 'v' : 'i'}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {hasRealVideo ? (
              <video
                ref={videoRef}
                src={activeVideoUrl}
                autoPlay
                loop
                muted={videoMuted}
                playsInline
                onError={() => setVideoLoadFailed(true)}
                className={`h-full w-full object-cover object-center transition-all duration-500 ease-out ${mediaToneClass}`}
              />
            ) : currentExercise.hasVerifiedPoseImage ? (
              <img
                src={exerciseMedia.playerVertUrl}
                alt={currentExercise.name}
                referrerPolicy="no-referrer"
                className={`h-full w-full ${
                  exerciseMedia.playerContain
                    ? 'object-contain pb-20'
                    : `object-cover ${exerciseMedia.focalClass ?? 'object-center'}`
                } transition-all duration-500 ease-out ${mediaToneClass}`}
              />
            ) : (
              <div
                className="flex h-full w-full flex-col items-center justify-center px-8 text-center"
                style={{ backgroundColor: WARM_TOKENS.surfaceBg, color: WARM_TOKENS.inkPrimary }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: WARM_TOKENS.canvasBg,
                    border: `1px solid ${WARM_TOKENS.hairlineBorder}`,
                    color: WARM_TOKENS.inkSecondary,
                  }}
                >
                  <Film className="w-7 h-7" />
                </div>
                <div className="text-[14.5px] font-semibold">暂无该动作实拍视频</div>
                <div
                  className="mt-1.5 text-[12.5px] leading-[1.55] max-w-[240px]"
                  style={{ color: WARM_TOKENS.inkSecondary }}
                >
                  请依据下方动作要领与目标肌群自行掌握动作幅度与呼吸节奏
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 清透晨光校准薄膜 */}
        <div
          className={`pointer-events-none absolute inset-0 ${WARM_TOKENS.photoCoolAirTintClass}`}
        />

        {/* 休息与过渡态平滑降亮柔纱 */}
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out ${
            WARM_TOKENS.restDimVeilClass
          } ${isDimmedStage ? 'opacity-100' : 'opacity-0'}`}
        />
      </motion.div>

      {/* Layer 1: 边缘可读性柔和渐层（扩展覆盖顶部提示与底部小字） */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-36"
        style={{
          background: isDimmedStage
            ? 'linear-gradient(180deg, rgba(25,29,34,0.34) 0%, rgba(25,29,34,0.12) 60%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(244,241,235,0.58) 0%, rgba(244,241,235,0.24) 58%, rgba(244,241,235,0) 100%)',
        }}
      />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 transition-all duration-300 ${
          isActivePhase ? (isSE ? 'h-[40%]' : 'h-[37%]') : 'h-[46%]'
        }`}
        style={{
          background: isActivePhase
            ? 'linear-gradient(180deg, rgba(244,241,235,0) 0%, rgba(244,241,235,0.42) 38%, rgba(244,241,235,0.78) 72%, rgba(244,241,235,0.92) 100%)'
            : WARM_TOKENS.playerBottomScrimOverlay,
        }}
      />

      {isSetCompletePhase && (
        <div
          className="pointer-events-none absolute inset-0 ring-2 ring-inset transition-opacity"
          style={{ ['--tw-ring-color' as string]: WARM_TOKENS.accent }}
        />
      )}

      {/* Layer 2: 顶部精密节拍轨与悬浮控件 */}
      <div className={`relative z-20 ${topSafePad} px-4`}>
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
                className="h-[2.5px] rounded-full transition-colors"
                style={{
                  backgroundColor: isDimmedStage
                    ? done
                      ? WARM_TOKENS.accent
                      : curr
                      ? WARM_TOKENS.restTextPrimary
                      : 'rgba(244,241,235,0.28)'
                    : done
                    ? WARM_TOKENS.accent
                    : curr
                    ? WARM_TOKENS.inkPrimary
                    : WARM_TOKENS.playerProgressPending,
                }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <GlassButton
            tone={isDimmedStage ? 'dim' : 'light'}
            onClick={() => setShowExitConfirm(true)}
            className="min-h-[40px] pl-2.5 pr-3.5 text-[12.5px] font-medium gap-0.5 whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>退出</span>
          </GlassButton>

          <GlassPanel
            variant={isDimmedStage ? 'dim-control' : 'control'}
            className="h-[36px] px-3 rounded-full flex items-center font-mono-num text-[12px] font-semibold whitespace-nowrap truncate"
            style={{
              color: topMetaColor,
            }}
          >
            <span>
              第 {currentRound}/{plan.rounds} 轮
            </span>
            <span className="mx-1.5 opacity-40" aria-hidden="true">
              ·
            </span>
            <span>
              动作 {exerciseIdx + 1}/{totalExercisesInRound}
            </span>
            <span className="mx-1.5 opacity-40" aria-hidden="true">
              ·
            </span>
            <span
              style={{
                color: isDimmedStage
                  ? WARM_TOKENS.restAccentText
                  : WARM_TOKENS.accentTextOnLight,
              }}
            >
              {formatTimeMMSS(elapsedSeconds)}
            </span>
          </GlassPanel>

          <GlassIconButton
            tone={isDimmedStage ? 'dim' : 'light'}
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label="语音提示开关"
            style={{
              opacity: soundEnabled ? 1 : 0.55,
            }}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </GlassIconButton>
        </div>

        {(isActivePhase || isPreparePhase) && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <GlassPanel
              variant={isDimmedStage ? 'dim-control' : 'control'}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium truncate"
              style={{
                color: topSubHintColor,
              }}
            >
              {hasRealVideo
                ? '示范循环中 · 按自身节奏发力（不锁速）'
                : '实景姿态参考 · 按自身节奏发力'}
            </GlassPanel>
            {isDebugPreviewMode && (
              <GlassPanel
                variant={isDimmedStage ? 'dim-control' : 'control'}
                className="shrink-0 font-mono-num text-[11.5px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  color: isDimmedStage ? WARM_TOKENS.restAccentText : WARM_TOKENS.auxSlate,
                }}
              >
                预览态
              </GlassPanel>
            )}
          </div>
        )}
      </div>

      {/* Layer 3: 中央状态舞台（准备 / 组间安静休息 / 动作切换） */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-5">
        <AnimatePresence mode="wait">
          {isPreparePhase && (
            <motion.div
              key="warm-stage-prepare"
              initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-[310px]"
              style={{ textShadow: '0 2px 16px rgba(25,29,34,0.42)' }}
            >
              <div
                className="text-[12.5px] font-semibold"
                style={{ color: WARM_TOKENS.restAccentText }}
              >
                第 {currentRound} 轮 · 准备就位
              </div>
              <h1
                className="mt-1.5 font-editorial-serif text-[30px] font-semibold leading-[1.16]"
                style={{ color: WARM_TOKENS.restTextPrimary }}
              >
                {currentExercise.name}
              </h1>
              <div
                className={`font-display-b mt-5 font-semibold leading-none tabular-nums ${
                  isSE ? 'text-[74px]' : 'text-[88px]'
                }`}
                style={{
                  color:
                    prepareRemaining <= 3
                      ? WARM_TOKENS.restAccentText
                      : WARM_TOKENS.restTextPrimary,
                }}
              >
                {prepareRemaining}
              </div>
              <p
                className="mt-4 text-[13px] leading-[1.58]"
                style={{ color: WARM_TOKENS.restTextSecondary }}
              >
                {currentExercise.nextPrepCue}
              </p>
              <div
                className="mt-2 font-mono-num text-[12px] font-medium"
                style={{ color: WARM_TOKENS.restAccentText }}
              >
                {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 目标{' '}
                {currentExercise.targetReps} {currentExercise.unit}
              </div>
            </motion.div>
          )}

          {isRestPhase && (
            <motion.div
              key="warm-stage-rest"
              initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center text-center"
            >
              {!restTriggeredBySet && loggedSets.length === 0 && (
                <div
                  className="mb-2.5 text-[12px] font-medium"
                  style={{ color: WARM_TOKENS.restAccentText }}
                >
                  未记录完成组（休息预览态 · 不写入档案）
                </div>
              )}

              <div
                className="text-[12.5px] font-semibold tracking-[0.02em]"
                style={{
                  color: WARM_TOKENS.restAccentText,
                  textShadow: '0 1px 10px rgba(25,29,34,0.42)',
                }}
              >
                {restContextLabel}
              </div>

              {/* 超大号倒计时数字成为唯一视觉焦点（无粗白圆环） */}
              <div
                className={`font-display-b mt-2 font-semibold leading-none tabular-nums tracking-[-0.03em] transition-colors ${
                  isSE ? 'text-[74px]' : 'text-[90px]'
                }`}
                style={{
                  color:
                    restRemaining <= 3
                      ? WARM_TOKENS.restAccentText
                      : WARM_TOKENS.restTextPrimary,
                  textShadow: '0 2px 18px rgba(25,29,34,0.38)',
                }}
              >
                {restWaitingManual ? '就绪' : formatTimeMMSS(restRemaining)}
              </div>

              {/* 极细水平时间线 */}
              <div
                className="mt-4 w-48 h-[2.5px] rounded-full overflow-hidden"
                style={{ backgroundColor: WARM_TOKENS.restProgressTrack }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-linear"
                  style={{
                    width: `${restProgressPct * 100}%`,
                    backgroundColor: WARM_TOKENS.accent,
                  }}
                />
              </div>

              <div
                className="mt-2.5 font-mono-num text-[12px] font-medium"
                style={{
                  color: WARM_TOKENS.restTextSecondary,
                  textShadow: '0 1px 10px rgba(25,29,34,0.36)',
                }}
              >
                已实休 {actualRestElapsed}s · 设定 {restTargetTotal}s
                {restWaitingManual ? ' · 等待手动开练' : ''}
              </div>

              {/* 简洁清晰的下一个动作预告卡片（半透明暖白液态玻璃） */}
              {nextExerciseAfterRest && nextRestAsset && (
                <GlassPanel
                  variant="rest"
                  className="mt-7 w-full max-w-[332px] rounded-2xl p-3 flex items-center gap-3 text-left"
                >
                  <div
                    className="w-[84px] aspect-[16/9] rounded-lg overflow-hidden shrink-0"
                    style={{ backgroundColor: WARM_TOKENS.surfaceBackdropStudio }}
                  >
                    <img
                      src={nextRestAsset.wideUrl}
                      alt={nextExerciseAfterRest.name}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full ${
                        nextRestAsset.wideContain
                          ? 'object-contain'
                          : `object-cover ${
                              nextRestAsset.wideFocalClass ??
                              nextRestAsset.focalClass ??
                              'object-center'
                            }`
                      } ${WARM_TOKENS.photoFilterClass}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[12px] font-semibold"
                      style={{ color: WARM_TOKENS.accentTextOnLight }}
                    >
                      {isLastExInRound
                        ? `下一个 · 第 ${currentRound + 1} 轮 01`
                        : `下一个动作 · ${String(exerciseIdx + 2).padStart(2, '0')}`}
                    </div>
                    <div
                      className="text-[14.5px] font-semibold truncate mt-0.5"
                      style={{ color: WARM_TOKENS.inkPrimary }}
                    >
                      {nextExerciseAfterRest.name}
                    </div>
                    <div
                      className="font-mono-num text-[12px] truncate mt-0.5"
                      style={{ color: WARM_TOKENS.inkSecondary }}
                    >
                      {nextExerciseAfterRest.targetReps} {nextExerciseAfterRest.unit} ·{' '}
                      {getExerciseWeightLabel(nextExerciseAfterRest.usesDumbbells)}
                    </div>
                  </div>
                </GlassPanel>
              )}
            </motion.div>
          )}

          {isNextTransitionPhase && (
            <motion.div
              key="warm-stage-next"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-[310px]"
              style={{ textShadow: '0 2px 16px rgba(25,29,34,0.42)' }}
            >
              <div
                className="text-[12.5px] font-semibold"
                style={{ color: WARM_TOKENS.restAccentText }}
              >
                {exerciseIdx === 0 && currentRound > 1
                  ? `第 ${currentRound - 1} 轮完成 · 开启第 ${currentRound} 轮`
                  : `切换动作 · ${String(exerciseIdx + 1).padStart(2, '0')}/${String(
                      totalExercisesInRound
                    ).padStart(2, '0')}`}
              </div>
              <h1
                className="mt-1.5 font-editorial-serif text-[30px] font-semibold leading-[1.16]"
                style={{ color: WARM_TOKENS.restTextPrimary }}
              >
                {currentExercise.name}
              </h1>
              <div
                className="mt-2 font-mono-num text-[12.5px]"
                style={{ color: WARM_TOKENS.restTextSecondary }}
              >
                {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 目标{' '}
                {currentExercise.targetReps} {currentExercise.unit}
                {currentExercise.isUnilateral ? ' · 左侧先开始' : ''}
              </div>
              <p
                className="mt-3 text-[13px] leading-[1.55]"
                style={{ color: WARM_TOKENS.restTextSecondary }}
              >
                {currentExercise.nextPrepCue}
              </p>
              <div
                className="font-display-b mt-4 text-[54px] font-semibold leading-none tabular-nums"
                style={{ color: WARM_TOKENS.restAccentText }}
              >
                {transitionSec}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Layer 4: 底部拇指操作区 */}
      <div
        className="relative z-20 px-4"
        style={{
          paddingBottom: `calc(${isSE ? '16px' : '28px'} + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <AnimatePresence mode="wait">
          {isPreparePhase && (
            <motion.div
              key="warm-ctrl-prepare"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <GlassButton
                elevated
                onClick={skipPreparation}
                className="w-full h-[52px] text-[15px] font-semibold"
              >
                我已就位，立即开始
              </GlassButton>
            </motion.div>
          )}

          {isNextTransitionPhase && (
            <motion.div
              key="warm-ctrl-next"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <GlassButton
                elevated
                onClick={startNextImmediately}
                className="w-full h-[52px] text-[15px] font-semibold"
              >
                直接开始本动作（{currentExercise.targetReps} {currentExercise.unit}）
              </GlassButton>
            </motion.div>
          )}

          {isRestPhase && (
            <motion.div
              key="warm-ctrl-rest"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2"
            >
              <GlassButton
                tone="dim"
                onClick={() => adjustActiveRest(-15)}
                className="h-[52px] px-4 font-mono-num text-[13.5px] font-semibold"
              >
                -15s
              </GlassButton>
              <GlassButton
                tone="dim"
                onClick={() => adjustActiveRest(15)}
                className="h-[52px] px-4 font-mono-num text-[13.5px] font-semibold"
              >
                +15s
              </GlassButton>
              <GlassButton
                elevated
                onClick={skipRestToNext}
                className="flex-1 h-[52px] text-[14.5px] font-semibold"
              >
                {restWaitingManual ? '开始下一动作' : '提前结束休息'}
              </GlassButton>
            </motion.div>
          )}

          {isSetCompletePhase && (
            <motion.div
              key="warm-ctrl-setcomplete"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="warm-lg-rest-card rounded-3xl p-4 space-y-3.5"
              style={{
                color: WARM_TOKENS.inkPrimary,
              }}
            >
              {latestLogged ? (
                <>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span
                      className="font-semibold"
                      style={{ color: WARM_TOKENS.accentTextOnLight }}
                    >
                      本组已实录 · {latestLogged.exerciseName}
                    </span>
                    <span className="font-mono-num" style={{ color: WARM_TOKENS.auxSlate }}>
                      {autoAdvancePaused ? '已暂停自动倒数' : `${setCompleteAutoSec}s 后进休息`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[13px]" style={{ color: WARM_TOKENS.inkSecondary }}>
                      微调实做次数
                    </span>
                    <div className="flex items-center gap-3">
                      <GlassIconButton
                        onClick={() => updateLatestSetReps(-1)}
                        aria-label="减少完成次数"
                        className="h-11 w-11 font-mono-num text-[18px] font-semibold"
                      >
                        −
                      </GlassIconButton>
                      <span
                        className="font-display-b text-[28px] font-semibold tabular-nums min-w-[44px] text-center"
                        style={{ color: WARM_TOKENS.inkPrimary }}
                      >
                        {latestLogged.actualReps}
                      </span>
                      <GlassIconButton
                        onClick={() => updateLatestSetReps(1)}
                        aria-label="增加完成次数"
                        className="h-11 w-11 font-mono-num text-[18px] font-semibold"
                      >
                        +
                      </GlassIconButton>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {EFFORT_OPTIONS.map((ef) => {
                      const active = latestLogged.effort === ef;
                      return (
                        <button
                          key={ef}
                          type="button"
                          onClick={() => updateLatestSetEffort(ef)}
                          className={`h-10 rounded-full text-[13px] font-medium cursor-pointer transition-all active:scale-95 ${
                            active ? '' : 'warm-lg-chip'
                          }`}
                          style={{
                            backgroundColor: active ? WARM_TOKENS.graphiteCtaBg : undefined,
                            color: active
                              ? WARM_TOKENS.graphiteCtaText
                              : WARM_TOKENS.inkSecondary,
                            fontWeight: active ? 600 : 500,
                            boxShadow: active
                              ? 'inset 0 1px 0 rgba(255,255,255,0.14), 0 6px 14px -5px rgba(25,29,34,0.28)'
                              : undefined,
                          }}
                        >
                          {ef}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={goToRestNow}
                    className="w-full h-[50px] rounded-full text-[14.5px] font-semibold cursor-pointer active:scale-[0.985] transition-transform"
                    style={{
                      backgroundColor: WARM_TOKENS.accent,
                      color: WARM_TOKENS.accentContrastText,
                    }}
                  >
                    {autoAdvancePaused ? '进入组间休息' : `立即进入休息 (${setCompleteAutoSec}s)`}
                  </button>
                </>
              ) : (
                <div className="space-y-3 text-center">
                  <div
                    className="text-[12.5px] leading-relaxed"
                    style={{ color: WARM_TOKENS.inkSecondary }}
                  >
                    尚未记录完成组（不伪造实录），请先在动作进行中点击「完成本动作」
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhase('active')}
                    className="w-full h-12 rounded-full text-[14px] font-semibold cursor-pointer"
                    style={{
                      backgroundColor: WARM_TOKENS.graphiteCtaBg,
                      color: WARM_TOKENS.graphiteCtaText,
                    }}
                  >
                    返回动作跟练
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {isActivePhase && (
            <motion.div
              key="warm-ctrl-active"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-end justify-between gap-3 mb-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentExercise.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="min-w-0 flex-1 pb-0.5"
                  >
                    {currentExercise.isUnilateral && (
                      <div className="warm-lg-control mb-2 inline-flex items-center p-0.5 rounded-full">
                        <button
                          type="button"
                          onClick={() => setCurrentSide('left')}
                          className="min-h-[30px] px-3 rounded-full text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors"
                          style={{
                            backgroundColor:
                              currentSide === 'left' ? WARM_TOKENS.accent : 'transparent',
                            color:
                              currentSide === 'left'
                                ? WARM_TOKENS.accentContrastText
                                : WARM_TOKENS.inkPrimary,
                            fontWeight: currentSide === 'left' ? 600 : 500,
                          }}
                        >
                          左侧 {currentSide === 'right' ? '✓' : '进行中'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentSide('right')}
                          className="min-h-[30px] px-3 rounded-full text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors"
                          style={{
                            backgroundColor:
                              currentSide === 'right' ? WARM_TOKENS.accent : 'transparent',
                            color:
                              currentSide === 'right'
                                ? WARM_TOKENS.accentContrastText
                                : WARM_TOKENS.inkPrimary,
                            fontWeight: currentSide === 'right' ? 600 : 500,
                          }}
                        >
                          右侧
                        </button>
                      </div>
                    )}

                    <div
                      className="text-[12px] font-semibold truncate"
                      style={{ color: WARM_TOKENS.accentTextOnLight }}
                    >
                      {currentExercise.muscleGroup} ·{' '}
                      {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 节奏{' '}
                      {currentExercise.tempo}
                    </div>

                    <h1
                      className={`mt-0.5 font-editorial-serif font-semibold leading-[1.16] truncate ${
                        isSE ? 'text-[24px]' : 'text-[28px]'
                      }`}
                      style={{ color: WARM_TOKENS.inkPrimary }}
                    >
                      {currentExercise.name}
                    </h1>

                    <p
                      className="mt-1 text-[12.5px] line-clamp-1"
                      style={{ color: WARM_TOKENS.inkSecondary }}
                    >
                      {soundEnabled ? currentExercise.voiceCue : currentExercise.targetMuscle}
                    </p>

                    {hasRealVideo && (
                      <div className="mt-2 flex items-center gap-2">
                        <GlassButton
                          onClick={replayCurrentVideo}
                          className="min-h-[34px] px-3 text-[12px] font-medium gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>重播</span>
                        </GlassButton>
                        <GlassButton
                          onClick={() => setVideoMuted(!videoMuted)}
                          className="min-h-[34px] px-3 text-[12px] font-medium gap-1"
                        >
                          {videoMuted ? (
                            <VolumeX className="w-3 h-3" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                          <span>{videoMuted ? '已静音' : '原声'}</span>
                        </GlassButton>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* 右缘利落悬浮次数调节器（吸收方案 2 的精准数字与结构分割） */}
                <GlassPanel
                  variant="control"
                  className="shrink-0 flex flex-col items-center rounded-full p-1"
                  style={{
                    color: WARM_TOKENS.inkPrimary,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setRepDraft((r) => r + 1)}
                    aria-label="增加次数"
                    className="h-11 w-11 rounded-full hover:bg-white/45 active:scale-90 font-mono-num text-[18px] font-semibold flex items-center justify-center cursor-pointer transition-all"
                  >
                    +
                  </button>
                  <div
                    className="w-6 h-[1px]"
                    style={{ backgroundColor: WARM_TOKENS.hairlineBorder }}
                  />
                  <button
                    type="button"
                    onClick={() => setRepDraft(currentExercise.targetReps)}
                    title="点击恢复目标次数"
                    className="py-1.5 px-1 text-center min-w-[44px] cursor-pointer"
                  >
                    <motion.div
                      key={repDraft}
                      initial={reduceMotion ? false : { scale: 1.12, opacity: 0.85 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.14 }}
                      className="font-display-b text-[26px] font-semibold leading-none tabular-nums"
                      style={{
                        color: repsModified
                          ? WARM_TOKENS.accentTextOnLight
                          : WARM_TOKENS.inkPrimary,
                      }}
                    >
                      {repDraft}
                    </motion.div>
                    <div
                      className="text-[10.5px] font-mono-num mt-0.5 flex items-center justify-center gap-0.5"
                      style={{
                        color: repsModified
                          ? WARM_TOKENS.accentTextOnLight
                          : WARM_TOKENS.inkSecondary,
                      }}
                    >
                      {repsModified ? (
                        <>
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>{currentExercise.targetReps}</span>
                        </>
                      ) : (
                        <span>{currentExercise.unit}</span>
                      )}
                    </div>
                  </button>
                  <div
                    className="w-6 h-[1px]"
                    style={{ backgroundColor: WARM_TOKENS.hairlineBorder }}
                  />
                  <button
                    type="button"
                    onClick={() => setRepDraft((r) => Math.max(1, r - 1))}
                    aria-label="减少次数"
                    className="h-11 w-11 rounded-full hover:bg-white/45 active:scale-90 font-mono-num text-[18px] font-semibold flex items-center justify-center cursor-pointer transition-all"
                  >
                    −
                  </button>
                </GlassPanel>
              </div>

              {/* 空间分离底部控件：醒目实色品牌橙主按钮 + 轻盈光学辅控条 */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCompleteActiveSet}
                  className="w-full h-[52px] rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                  style={{
                    backgroundColor: WARM_TOKENS.accent,
                    color: WARM_TOKENS.accentContrastText,
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.34), 0 10px 24px -8px rgba(194,65,12,0.6)',
                  }}
                >
                  <Check className="w-5 h-5 stroke-[2.25]" />
                  <span>
                    {currentExercise.isUnilateral && currentSide === 'left'
                      ? `完成左侧 (${repDraft} ${currentExercise.unit}) · 切右侧`
                      : isLastExInRound && isLastRound
                      ? `完成收官组 · 记 ${repDraft} ${currentExercise.unit}`
                      : `完成本动作 · 记 ${repDraft} ${currentExercise.unit}`}
                  </span>
                </button>

                <GlassPanel
                  variant="control"
                  className="rounded-full p-1 grid grid-cols-3 items-center"
                  style={{
                    color: WARM_TOKENS.inkPrimary,
                  }}
                >
                  <button
                    type="button"
                    onClick={goToPrevExercise}
                    disabled={!prevExercisePreview}
                    className="warm-lg-interactive min-h-[42px] rounded-full flex items-center justify-center gap-1 text-[12.5px] font-medium disabled:opacity-30 cursor-pointer"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                    <span>上一动作</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className="warm-lg-interactive min-h-[42px] rounded-full flex items-center justify-center gap-1.5 text-[12.5px] font-medium cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? '继续' : '暂停'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={skipCurrentExercise}
                    className="warm-lg-interactive min-h-[42px] rounded-full flex items-center justify-center gap-1 text-[12.5px] font-medium cursor-pointer"
                  >
                    <span>跳过动作</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </GlassPanel>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 暂停遮罩 */}
      {isPaused && (
        <GlassOverlay variant="pause">
          <div
            className="text-[12.5px] font-semibold"
            style={{ color: WARM_TOKENS.auxSlate }}
          >
            主动暂停 · 已暂停 {pausedSeconds}s
          </div>
          <h2 className="mt-2 font-editorial-serif text-[26px] font-semibold text-balance">
            暂不记录完成，也不跳过动作
          </h2>
          <p className="mt-2 text-[13px]" style={{ color: WARM_TOKENS.inkSecondary }}>
            第 {currentRound}/{plan.rounds} 轮 · {currentExercise.name}
          </p>
          <div className="mt-7 w-full space-y-2.5">
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="w-full h-[52px] rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
              style={{
                backgroundColor: WARM_TOKENS.accent,
                color: WARM_TOKENS.accentContrastText,
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.34), 0 10px 24px -8px rgba(194,65,12,0.6)',
              }}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>继续跟练</span>
            </button>
            <GlassButton
              onClick={exitWorkoutEarly}
              className="w-full h-[48px] text-[13.5px] font-medium"
            >
              提前结束训练（已录 {loggedSets.length} 组）
            </GlassButton>
          </div>
        </GlassOverlay>
      )}

      {/* 退出确认抽屉 */}
      {showExitConfirm && (
        <GlassOverlay variant="scrim" className="z-50">
          <GlassPanel
            variant="sheet"
            className="rounded-t-3xl p-5"
            style={{
              color: WARM_TOKENS.inkPrimary,
              paddingBottom: `calc(${isSE ? '16px' : '28px'} + env(safe-area-inset-bottom, 0px))`,
            }}
          >
            <div
              className="mx-auto mb-3 h-1 w-10 rounded-full"
              style={{ backgroundColor: WARM_TOKENS.hairlineStrong }}
            />
            <h3 className="text-[17px] font-semibold">确认退出本次训练？</h3>
            <p
              className="mt-1.5 text-[13px] leading-[1.55]"
              style={{ color: WARM_TOKENS.inkSecondary }}
            >
              {loggedSets.length === 0
                ? '尚未记录任何完成组，退出将标记为「提前结束（完成 0 组）」，不计入完成次数。'
                : `已实录 ${loggedSets.length} 组，退出将保存实录并记为「提前结束（部分完成）」。`}
            </p>
            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full h-12 rounded-full text-[14.5px] font-semibold cursor-pointer active:scale-[0.98] transition-all"
                style={{
                  backgroundColor: WARM_TOKENS.graphiteCtaBg,
                  color: WARM_TOKENS.graphiteCtaText,
                }}
              >
                继续当前训练
              </button>
              <GlassButton
                onClick={exitWorkoutEarly}
                className="w-full h-12 text-[14px] font-medium"
              >
                提前结束并查看总结
              </GlassButton>
            </div>
          </GlassPanel>
        </GlassOverlay>
      )}
    </motion.div>
  );
};
