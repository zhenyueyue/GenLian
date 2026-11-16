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
import { getMoodExerciseMedia, MoodThemeConfig } from './moodThemes';

interface MoodPlayerViewProps {
  theme: MoodThemeConfig;
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
  onFinishToArchive: () => void;
}

const EFFORT_OPTIONS: EffortLevel[] = ['轻松', '正好', '吃力'];

export const MoodPlayerView: React.FC<MoodPlayerViewProps> = ({
  theme,
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
  const bottomSafePad = isSE ? 'pb-4' : 'pb-7';

  // 训练完成 / 提前结束总结页
  if (phase === 'summary') {
    const isCompleted = sessionOutcome === 'completed';
    const isZeroExit = sessionOutcome === 'early_exit_zero';
    const totalActualReps = loggedSets.reduce((acc, s) => acc + s.actualReps, 0);
    const planMedia = theme.planMedia[plan.id] ?? theme.planMedia['strength-a'];

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
        style={{ backgroundColor: theme.canvasBg, color: theme.textPrimary }}
      >
        <div className={`iphone-scroll flex-1 overflow-y-auto ${isSE ? 'pb-28' : 'pb-32'}`}>
          <div
            className={`relative w-full overflow-hidden ${isSE ? 'h-[245px]' : 'h-[285px]'}`}
            style={{ backgroundColor: theme.detailHeaderBg }}
          >
            <img
              src={planMedia.wideUrl}
              alt={plan.title}
              referrerPolicy="no-referrer"
              className={`h-full w-full object-cover object-center ${
                isZeroExit ? 'grayscale opacity-65' : theme.photoToneFilterClass
              }`}
            />
            <div className={`pointer-events-none absolute inset-0 ${theme.photoToneTintClass}`} />
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: theme.detailHeaderOverlay }}
            />

            <div className={`absolute inset-x-0 bottom-0 px-5 pb-4 ${topSafePad}`}>
              <div
                className="text-[12px] font-semibold tracking-[0.02em]"
                style={{
                  color: isCompleted
                    ? theme.detailHeaderAccent
                    : isZeroExit
                    ? theme.detailHeaderMeta
                    : theme.warning,
                }}
              >
                {isCompleted
                  ? '今日训练完整完成'
                  : isZeroExit
                  ? '提前结束 · 完成 0 组'
                  : '提前结束 · 保留部分实录'}
              </div>
              <h1
                className="mt-1.5 text-[26px] font-semibold leading-[1.18] tracking-[-0.015em] text-balance"
                style={{ color: theme.detailHeaderTitle }}
              >
                {isCompleted
                  ? '按计划完成全部轮次'
                  : isZeroExit
                  ? '未计入完整课程完成次数'
                  : '已记下本次完成组，不影响节奏'}
              </h1>
              <div
                className="mt-2 font-mono-num text-[12px]"
                style={{ color: theme.detailHeaderMeta }}
              >
                {plan.category} · {sessionStartedAt || '--:--'} → {sessionEndedAt || '--:--'} · 暂停{' '}
                {pausedSeconds}s
              </div>
            </div>
          </div>

          <div className="px-5">
            <div
              className="grid grid-cols-3 gap-4 py-6"
              style={{
                borderTop: `1px solid ${theme.hairlineBorder}`,
                borderBottom: `1px solid ${theme.hairlineBorder}`,
              }}
            >
              <div>
                <div
                  className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                  style={{ color: theme.textPrimary }}
                >
                  {loggedSets.length}
                </div>
                <div className="text-[12px] mt-2" style={{ color: theme.textMuted }}>
                  完成组数
                </div>
              </div>
              <div>
                <div
                  className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                  style={{ color: theme.textPrimary }}
                >
                  {totalActualReps}
                </div>
                <div className="text-[12px] mt-2" style={{ color: theme.textMuted }}>
                  累计次数/秒
                </div>
              </div>
              <div>
                <div
                  className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                  style={{ color: theme.accent }}
                >
                  {formatTimeMMSS(elapsedSeconds)}
                </div>
                <div className="text-[12px] mt-2" style={{ color: theme.textMuted }}>
                  有效时长
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-[15px] font-semibold" style={{ color: theme.textPrimary }}>
                  本次训练实录
                </span>
                <span className="font-mono-num text-[12px]" style={{ color: theme.textMuted }}>
                  共 {loggedSets.length} 组
                </span>
              </div>

              {loggedSets.length === 0 ? (
                <div
                  className="rounded-2xl p-4 text-[13px] leading-[1.6]"
                  style={{ backgroundColor: theme.surfaceBg, color: theme.textSecondary }}
                >
                  本次未记录任何完成组，系统不会伪造训练容量，也不会计入完整课程完成次数。
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedRounds.map(([roundNum, items]) => (
                    <div key={roundNum}>
                      <div
                        className="text-[12px] font-semibold pb-1.5"
                        style={{
                          color: theme.accent,
                          borderBottom: `1px solid ${theme.hairlineBorder}`,
                        }}
                      >
                        第 {roundNum} 轮
                      </div>
                      <div>
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="py-3.5 flex items-center justify-between gap-3"
                            style={{ borderBottom: `1px solid ${theme.hairlineBorder}` }}
                          >
                            <div className="min-w-0">
                              <div
                                className="text-[14.5px] font-semibold truncate"
                                style={{ color: theme.textPrimary }}
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
                                style={{ color: theme.textMuted }}
                              >
                                {item.weightUsed} · 休息 {item.actualRestSeconds}s
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div
                                className="font-display-b text-[18px] font-semibold tabular-nums leading-tight"
                                style={{ color: theme.textPrimary }}
                              >
                                {item.actualReps}{' '}
                                <span
                                  className="text-[12px] font-normal"
                                  style={{ color: theme.textSecondary }}
                                >
                                  /{item.targetReps} {item.unit}
                                </span>
                              </div>
                              <div
                                className="text-[12px] font-medium mt-0.5"
                                style={{ color: theme.accent }}
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
                <div className="text-[13px] font-semibold mb-2" style={{ color: theme.warning }}>
                  跳过动作（{skippedRecords.length} 项 · 未计为完成）
                </div>
                <div className="space-y-1.5">
                  {skippedRecords.map((sk, idx) => (
                    <div
                      key={`${sk.timestamp}-${idx}`}
                      className="rounded-xl px-3.5 py-2.5 text-[12.5px] flex items-center justify-between"
                      style={{ backgroundColor: theme.surfaceBg, color: theme.textSecondary }}
                    >
                      <span>
                        第 {sk.round} 轮 · {sk.exerciseName}
                      </span>
                      <span className="font-mono-num text-[12px]">{sk.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className={`absolute bottom-0 inset-x-0 px-5 pt-5 ${bottomSafePad}`}
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${theme.canvasBg} 38%, ${theme.canvasBg} 100%)`,
          }}
        >
          <button
            type="button"
            onClick={onFinishToArchive}
            className="w-full h-[52px] rounded-full text-[15px] font-semibold active:scale-[0.985] transition-all cursor-pointer shadow-[0_10px_24px_-6px_rgba(0,0,0,0.22)]"
            style={{
              backgroundColor: theme.primaryCtaBg,
              color: theme.primaryCtaText,
            }}
          >
            收入个人训练档案
          </button>
        </div>
      </motion.div>
    );
  }

  const hasRealVideo = Boolean(activeVideoUrl) && !videoLoadFailed;
  const exerciseMedia = getMoodExerciseMedia(theme, currentExercise);
  const latestLogged = loggedSets[loggedSets.length - 1];
  const restProgressPct =
    restTargetTotal > 0 ? Math.max(0, Math.min(1, restRemaining / restTargetTotal)) : 0;
  const repsModified = repDraft !== currentExercise.targetReps;

  const isActivePhase = phase === 'active';
  const isPreparePhase = phase === 'prepare';
  const isSetCompletePhase = phase === 'setComplete';
  const isRestPhase = phase === 'rest';
  const isNextTransitionPhase = phase === 'nextTransition';

  const isDimmedStage = isRestPhase || isPreparePhase || isNextTransitionPhase || isSetCompletePhase;

  const mediaToneClass = isRestPhase
    ? theme.restDimFilterClass
    : isSetCompletePhase
    ? 'scale-[1.015] brightness-[0.55] saturate-[0.78]'
    : isPreparePhase || isNextTransitionPhase
    ? 'scale-[1.01] brightness-[0.60] saturate-[0.82]'
    : theme.playerImageFilterClass;

  const nextRestAsset = nextExerciseAfterRest
    ? getMoodExerciseMedia(theme, nextExerciseAfterRest)
    : null;

  const isDynamic = theme.id === 'dynamic';

  // 在亮色 Active 舞台中文字随日光氛围清晰可见；进入 Dim/Rest 阶段时自动切到柔和浅字
  const topControlGlassStyle: React.CSSProperties = isDimmedStage
    ? {
        backgroundColor: theme.restSecondaryBtnBg,
        border: `1px solid ${theme.restSecondaryBtnBorder}`,
        color: theme.restTextPrimary,
      }
    : {
        backgroundColor: theme.playerGlassBg,
        border: `1px solid ${theme.playerGlassBorder}`,
        color: theme.playerGlassText,
      };

  const topMetaColor = isDimmedStage ? theme.restTextPrimary : theme.playerActiveTextPrimary;
  const topSubHintColor = isDimmedStage ? theme.restTextSecondary : theme.playerActiveTextSecondary;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0.75 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0.45 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full flex-col overflow-hidden"
      style={{ backgroundColor: theme.surfaceBg }}
    >
      {/* Layer 0: 100% 全屏运动舞台（从动作详情共享 layoutId 扩展，且休息时平滑降亮降饱和，不跳黑屏） */}
      <motion.div
        layoutId={reduceMotion ? undefined : `mood-${theme.id}-stage-media`}
        transition={{ duration: reduceMotion ? 0.01 : 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 overflow-hidden"
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={`${theme.id}-${currentExercise.id}-${hasRealVideo ? 'v' : 'i'}`}
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
                className={`h-full w-full object-cover object-center transition-all duration-500 ease-out ${mediaToneClass}`}
              />
            ) : (
              <div
                className="flex h-full w-full flex-col items-center justify-center px-8 text-center"
                style={{ backgroundColor: theme.surfaceBg, color: theme.textPrimary }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: theme.canvasBg,
                    border: `1px solid ${theme.hairlineBorder}`,
                    color: theme.textSecondary,
                  }}
                >
                  <Film className="w-7 h-7" />
                </div>
                <div className="text-[14.5px] font-semibold">暂无该动作实拍视频</div>
                <div className="mt-1.5 text-[12.5px] leading-[1.5] max-w-[240px]" style={{ color: theme.textSecondary }}>
                  请依据下方动作要领与目标肌群自行掌握动作幅度与呼吸节奏
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Mood 色调微调层 */}
        <div className={`pointer-events-none absolute inset-0 ${theme.photoToneTintClass}`} />

        {/* 休息/过渡阶段平滑调暗呼吸纱层（500ms 柔和沉静过渡） */}
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out ${
            theme.restDimVeilClass
          } ${isDimmedStage ? 'opacity-100' : 'opacity-0'}`}
        />
      </motion.div>

      {/* Layer 1: 极克制边缘可读性过渡 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ background: isDimmedStage ? 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 100%)' : theme.playerTopScrim }}
      />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 transition-all duration-300 ${
          isActivePhase ? (isSE ? 'h-[30%]' : 'h-[27%]') : 'h-[48%]'
        }`}
        style={{
          background: isActivePhase
            ? theme.playerBottomScrimActive
            : theme.playerBottomScrimOverlay,
        }}
      />

      {isSetCompletePhase && (
        <div
          className="pointer-events-none absolute inset-0 ring-2 ring-inset transition-opacity"
          style={{ ['--tw-ring-color' as string]: theme.accent }}
        />
      )}

      {/* Layer 2: 顶部轻量悬浮轨道与时间码 */}
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
                      ? theme.restProgressFill
                      : curr
                      ? theme.restTextPrimary
                      : 'rgba(255,255,255,0.28)'
                    : done
                    ? theme.playerProgressDone
                    : curr
                    ? theme.playerProgressCurrent
                    : theme.playerProgressPending,
                }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="min-h-[40px] pl-2.5 pr-3.5 rounded-full backdrop-blur-xl text-[12.5px] font-medium flex items-center gap-0.5 whitespace-nowrap shrink-0 cursor-pointer active:scale-95 transition-all"
            style={topControlGlassStyle}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>退出</span>
          </button>

          <div
            className="font-mono-num text-[12px] font-semibold whitespace-nowrap truncate"
            style={{
              color: topMetaColor,
              textShadow: isDynamic || isDimmedStage ? '0 1px 8px rgba(0,0,0,0.65)' : undefined,
            }}
          >
            <span>
              第 {currentRound}/{plan.rounds} 轮
            </span>
            <span className="mx-1.5 opacity-45" aria-hidden="true">
              ·
            </span>
            <span>
              动作 {exerciseIdx + 1}/{totalExercisesInRound}
            </span>
            <span className="mx-1.5 opacity-45" aria-hidden="true">
              ·
            </span>
            <span style={{ color: isDimmedStage ? theme.restAccentText : theme.playerActiveAccentText }}>
              {formatTimeMMSS(elapsedSeconds)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label="语音提示开关"
            className="min-h-[40px] min-w-[40px] rounded-full backdrop-blur-xl flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all"
            style={{
              ...topControlGlassStyle,
              opacity: soundEnabled ? 1 : 0.55,
            }}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {(isActivePhase || isPreparePhase) && (
          <div
            className="mt-2 flex items-center justify-between gap-2 text-[12px] font-medium"
            style={{
              color: topSubHintColor,
              textShadow: isDynamic || isDimmedStage ? '0 1px 6px rgba(0,0,0,0.65)' : undefined,
            }}
          >
            <span className="truncate">
              {hasRealVideo
                ? '示范循环中 · 按自身节奏发力（不锁速）'
                : '实景姿态参考 · 按自身节奏发力'}
            </span>
            {isDebugPreviewMode && (
              <span
                className="shrink-0 font-mono-num font-semibold"
                style={{ color: isDimmedStage ? theme.restAccentText : theme.playerActiveAccentText }}
              >
                [预览]
              </span>
            )}
          </div>
        )}
      </div>

      {/* Layer 3: 中央状态舞台 */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-5">
        <AnimatePresence mode="wait">
          {isPreparePhase && (
            <motion.div
              key="stage-prepare"
              initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-[310px]"
            >
              <div className="text-[12.5px] font-semibold" style={{ color: theme.restAccentText }}>
                第 {currentRound} 轮 · 准备就位
              </div>
              <h1
                className="mt-1.5 text-[27px] font-semibold leading-[1.2]"
                style={{ color: theme.restTextPrimary }}
              >
                {currentExercise.name}
              </h1>
              <div
                className={`font-display-b mt-5 font-semibold leading-none tabular-nums ${
                  isSE ? 'text-[74px]' : 'text-[88px]'
                }`}
                style={{
                  color: prepareRemaining <= 3 ? theme.restAccentText : theme.restTextPrimary,
                }}
              >
                {prepareRemaining}
              </div>
              <p
                className="mt-4 text-[13px] leading-[1.55]"
                style={{ color: theme.restTextSecondary }}
              >
                {currentExercise.nextPrepCue}
              </p>
              <div
                className="mt-2 font-mono-num text-[12px] font-medium"
                style={{ color: theme.restAccentText }}
              >
                {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 目标{' '}
                {currentExercise.targetReps} {currentExercise.unit}
              </div>
            </motion.div>
          )}

          {isRestPhase && (
            <motion.div
              key="stage-rest"
              initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center text-center"
            >
              {!restTriggeredBySet && loggedSets.length === 0 && (
                <div
                  className="mb-2.5 text-[12px] font-medium"
                  style={{ color: theme.restAccentText }}
                >
                  未记录完成组（休息预览态 · 不写入档案）
                </div>
              )}

              <div className="text-[12.5px] font-semibold" style={{ color: theme.restAccentText }}>
                {restKind === 'round' ? `第 ${currentRound} 轮已完成 · 轮间恢复` : '组间安静恢复'}
              </div>

              <div
                className={`font-display-b mt-2 font-semibold leading-none tabular-nums tracking-[-0.03em] transition-colors ${
                  isSE ? 'text-[74px]' : 'text-[90px]'
                }`}
                style={{
                  color: restRemaining <= 3 ? theme.restAccentText : theme.restTextPrimary,
                }}
              >
                {restWaitingManual ? '就绪' : formatTimeMMSS(restRemaining)}
              </div>

              <div
                className="mt-4 w-48 h-[2.5px] rounded-full overflow-hidden"
                style={{ backgroundColor: theme.restProgressTrack }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-linear"
                  style={{
                    width: `${restProgressPct * 100}%`,
                    backgroundColor: theme.restProgressFill,
                  }}
                />
              </div>

              <div
                className="mt-2.5 font-mono-num text-[12px]"
                style={{ color: theme.restTextSecondary }}
              >
                已实休 {actualRestElapsed}s · 设定 {restTargetTotal}s
                {restWaitingManual ? ' · 等待手动开练' : ''}
              </div>

              {nextExerciseAfterRest && nextRestAsset && (
                <div
                  className="mt-7 w-full max-w-[332px] rounded-2xl backdrop-blur-xl p-3 flex items-center gap-3 text-left shadow-[0_14px_32px_rgba(0,0,0,0.22)]"
                  style={{
                    backgroundColor: theme.restPreviewCardBg,
                    border: `1px solid ${theme.restPreviewCardBorder}`,
                  }}
                >
                  <div
                    className="w-[84px] aspect-[16/9] rounded-lg overflow-hidden shrink-0"
                    style={{ backgroundColor: theme.surfaceBg }}
                  >
                    <img
                      src={nextRestAsset.wideUrl}
                      alt={nextExerciseAfterRest.name}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full object-cover ${
                        nextRestAsset.focalClass ?? 'object-center'
                      } ${theme.photoToneFilterClass}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[12px] font-semibold"
                      style={{ color: isDynamic ? '#FF8468' : theme.accent }}
                    >
                      {isLastExInRound
                        ? `下一个 · 第 ${currentRound + 1} 轮 01`
                        : `下一个动作 · 0${exerciseIdx + 2}`}
                    </div>
                    <div
                      className="text-[14.5px] font-semibold truncate mt-0.5"
                      style={{ color: isDynamic ? '#FFFFFF' : theme.textPrimary }}
                    >
                      {nextExerciseAfterRest.name}
                    </div>
                    <div
                      className="font-mono-num text-[12px] truncate mt-0.5"
                      style={{ color: isDynamic ? '#CFD5E1' : theme.textSecondary }}
                    >
                      {nextExerciseAfterRest.targetReps} {nextExerciseAfterRest.unit} ·{' '}
                      {getExerciseWeightLabel(nextExerciseAfterRest.usesDumbbells)}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {isNextTransitionPhase && (
            <motion.div
              key="stage-next"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-[310px]"
            >
              <div className="text-[12.5px] font-semibold" style={{ color: theme.restAccentText }}>
                {exerciseIdx === 0 && currentRound > 1
                  ? `第 ${currentRound - 1} 轮完成 · 开启第 ${currentRound} 轮`
                  : `切换动作 · 0${exerciseIdx + 1}/0${totalExercisesInRound}`}
              </div>
              <h1
                className="mt-1.5 text-[28px] font-semibold leading-[1.2]"
                style={{ color: theme.restTextPrimary }}
              >
                {currentExercise.name}
              </h1>
              <div
                className="mt-2 font-mono-num text-[12.5px]"
                style={{ color: theme.restTextSecondary }}
              >
                {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 目标{' '}
                {currentExercise.targetReps} {currentExercise.unit}
                {currentExercise.isUnilateral ? ' · 左侧先开始' : ''}
              </div>
              <p
                className="mt-3 text-[13px] leading-[1.55]"
                style={{ color: theme.restTextSecondary }}
              >
                {currentExercise.nextPrepCue}
              </p>
              <div
                className="font-display-b mt-4 text-[54px] font-semibold leading-none tabular-nums"
                style={{ color: theme.restAccentText }}
              >
                {transitionSec}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Layer 4: 底部悬浮操作层 */}
      <div className={`relative z-20 px-4 ${bottomSafePad}`}>
        <AnimatePresence mode="wait">
          {isPreparePhase && (
            <motion.div
              key="ctrl-prepare"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <button
                type="button"
                onClick={skipPreparation}
                className="w-full h-[52px] rounded-full text-[15px] font-semibold cursor-pointer active:scale-[0.985] transition-transform shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)]"
                style={{
                  backgroundColor: theme.restPrimaryCtaBg,
                  color: theme.restPrimaryCtaText,
                }}
              >
                我已就位，立即开始
              </button>
            </motion.div>
          )}

          {isNextTransitionPhase && (
            <motion.div
              key="ctrl-next"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <button
                type="button"
                onClick={startNextImmediately}
                className="w-full h-[52px] rounded-full text-[15px] font-semibold cursor-pointer active:scale-[0.985] transition-transform shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)]"
                style={{
                  backgroundColor: theme.restPrimaryCtaBg,
                  color: theme.restPrimaryCtaText,
                }}
              >
                直接开始本动作（{currentExercise.targetReps} {currentExercise.unit}）
              </button>
            </motion.div>
          )}

          {isRestPhase && (
            <motion.div
              key="ctrl-rest"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => adjustActiveRest(-15)}
                className="h-[52px] px-4 rounded-full backdrop-blur-xl font-mono-num text-[13.5px] font-semibold cursor-pointer active:scale-95 transition-transform"
                style={{
                  backgroundColor: theme.restSecondaryBtnBg,
                  border: `1px solid ${theme.restSecondaryBtnBorder}`,
                  color: theme.restSecondaryBtnText,
                }}
              >
                -15s
              </button>
              <button
                type="button"
                onClick={() => adjustActiveRest(15)}
                className="h-[52px] px-4 rounded-full backdrop-blur-xl font-mono-num text-[13.5px] font-semibold cursor-pointer active:scale-95 transition-transform"
                style={{
                  backgroundColor: theme.restSecondaryBtnBg,
                  border: `1px solid ${theme.restSecondaryBtnBorder}`,
                  color: theme.restSecondaryBtnText,
                }}
              >
                +15s
              </button>
              <button
                type="button"
                onClick={skipRestToNext}
                className="flex-1 h-[52px] rounded-full text-[14.5px] font-semibold cursor-pointer active:scale-[0.985] transition-transform shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)]"
                style={{
                  backgroundColor: theme.restPrimaryCtaBg,
                  color: theme.restPrimaryCtaText,
                }}
              >
                {restWaitingManual ? '开始下一动作' : '提前结束休息'}
              </button>
            </motion.div>
          )}

          {isSetCompletePhase && (
            <motion.div
              key="ctrl-setcomplete"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl backdrop-blur-xl p-4 space-y-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.32)]"
              style={{
                backgroundColor: theme.canvasBg,
                color: theme.textPrimary,
                border: `1px solid ${theme.hairlineBorder}`,
              }}
            >
              {latestLogged ? (
                <>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold" style={{ color: theme.accent }}>
                      本组已实录 · {latestLogged.exerciseName}
                    </span>
                    <span className="font-mono-num" style={{ color: theme.textMuted }}>
                      {autoAdvancePaused ? '已暂停自动倒数' : `${setCompleteAutoSec}s 后进休息`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[13px]" style={{ color: theme.textSecondary }}>
                      微调实做次数
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateLatestSetReps(-1)}
                        className="h-11 w-11 rounded-full font-mono-num text-[18px] font-semibold cursor-pointer"
                        style={{ backgroundColor: theme.surfaceBg, color: theme.textPrimary }}
                      >
                        −
                      </button>
                      <span
                        className="font-display-b text-[28px] font-semibold tabular-nums min-w-[44px] text-center"
                        style={{ color: theme.textPrimary }}
                      >
                        {latestLogged.actualReps}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateLatestSetReps(1)}
                        className="h-11 w-11 rounded-full font-mono-num text-[18px] font-semibold cursor-pointer"
                        style={{ backgroundColor: theme.surfaceBg, color: theme.textPrimary }}
                      >
                        +
                      </button>
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
                          className="h-10 rounded-full text-[13px] font-medium cursor-pointer transition-colors"
                          style={{
                            backgroundColor: active ? theme.accent : theme.surfaceBg,
                            color: active ? theme.accentContrastText : theme.textSecondary,
                            fontWeight: active ? 600 : 500,
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
                      backgroundColor: theme.primaryCtaBg,
                      color: theme.primaryCtaText,
                    }}
                  >
                    {autoAdvancePaused ? '进入组间休息' : `立即进入休息 (${setCompleteAutoSec}s)`}
                  </button>
                </>
              ) : (
                <div className="space-y-3 text-center">
                  <div className="text-[12.5px] leading-relaxed" style={{ color: theme.textSecondary }}>
                    尚未记录完成组（不伪造实录），请先在动作进行中点击「完成本动作」
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhase('active')}
                    className="w-full h-12 rounded-full text-[14px] font-semibold cursor-pointer"
                    style={{
                      backgroundColor: theme.primaryCtaBg,
                      color: theme.primaryCtaText,
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
              key="ctrl-active"
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
                      <div
                        className="mb-2 inline-flex items-center p-0.5 rounded-full backdrop-blur-xl"
                        style={{
                          backgroundColor: theme.playerGlassBg,
                          border: `1px solid ${theme.playerGlassBorder}`,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setCurrentSide('left')}
                          className="min-h-[30px] px-3 rounded-full text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors"
                          style={{
                            backgroundColor:
                              currentSide === 'left' ? theme.accent : 'transparent',
                            color:
                              currentSide === 'left'
                                ? theme.accentContrastText
                                : theme.playerGlassText,
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
                              currentSide === 'right' ? theme.accent : 'transparent',
                            color:
                              currentSide === 'right'
                                ? theme.accentContrastText
                                : theme.playerGlassText,
                            fontWeight: currentSide === 'right' ? 600 : 500,
                          }}
                        >
                          右侧
                        </button>
                      </div>
                    )}

                    <div
                      className="text-[12px] font-semibold truncate"
                      style={{
                        color: theme.playerActiveAccentText,
                        textShadow: theme.playerActiveTextShadow,
                      }}
                    >
                      {currentExercise.muscleGroup} ·{' '}
                      {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 节奏{' '}
                      {currentExercise.tempo}
                    </div>

                    <h1
                      className={`mt-0.5 font-semibold leading-[1.18] truncate ${
                        isSE ? 'text-[22px]' : 'text-[25px]'
                      }`}
                      style={{
                        color: theme.playerActiveTextPrimary,
                        textShadow: theme.playerActiveTextShadow,
                      }}
                    >
                      {currentExercise.name}
                    </h1>

                    <p
                      className="mt-1 text-[12.5px] line-clamp-1"
                      style={{
                        color: theme.playerActiveTextSecondary,
                        textShadow: theme.playerActiveTextShadow,
                      }}
                    >
                      {soundEnabled ? currentExercise.voiceCue : currentExercise.targetMuscle}
                    </p>

                    {hasRealVideo && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={replayCurrentVideo}
                          className="min-h-[34px] px-3 rounded-full backdrop-blur-xl text-[12px] font-medium flex items-center gap-1 cursor-pointer"
                          style={{
                            backgroundColor: theme.playerGlassBg,
                            border: `1px solid ${theme.playerGlassBorder}`,
                            color: theme.playerGlassText,
                          }}
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>重播</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoMuted(!videoMuted)}
                          className="min-h-[34px] px-3 rounded-full backdrop-blur-xl text-[12px] font-medium flex items-center gap-1 cursor-pointer"
                          style={{
                            backgroundColor: theme.playerGlassBg,
                            border: `1px solid ${theme.playerGlassBorder}`,
                            color: theme.playerGlassText,
                          }}
                        >
                          {videoMuted ? (
                            <VolumeX className="w-3 h-3" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                          <span>{videoMuted ? '已静音' : '原声'}</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* 右缘一体式悬浮次数调节胶囊 */}
                <div
                  className="shrink-0 flex flex-col items-center rounded-full backdrop-blur-xl p-1 shadow-[0_10px_28px_rgba(0,0,0,0.18)]"
                  style={{
                    backgroundColor: theme.playerGlassBg,
                    border: `1px solid ${theme.playerGlassBorder}`,
                    color: theme.playerGlassText,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setRepDraft((r) => r + 1)}
                    aria-label="增加次数"
                    className="h-11 w-11 rounded-full active:scale-90 font-mono-num text-[18px] font-semibold flex items-center justify-center cursor-pointer transition-all"
                  >
                    +
                  </button>
                  <div
                    className="w-6 h-[1px]"
                    style={{ backgroundColor: theme.playerGlassBorder }}
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
                          ? theme.playerActiveAccentText
                          : theme.playerGlassText,
                      }}
                    >
                      {repDraft}
                    </motion.div>
                    <div
                      className="text-[10.5px] font-mono-num mt-0.5 flex items-center justify-center gap-0.5"
                      style={{
                        color: repsModified
                          ? theme.playerActiveAccentText
                          : theme.playerActiveTextSecondary,
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
                    style={{ backgroundColor: theme.playerGlassBorder }}
                  />
                  <button
                    type="button"
                    onClick={() => setRepDraft((r) => Math.max(1, r - 1))}
                    aria-label="减少次数"
                    className="h-11 w-11 rounded-full active:scale-90 font-mono-num text-[18px] font-semibold flex items-center justify-center cursor-pointer transition-all"
                  >
                    −
                  </button>
                </div>
              </div>

              {/* 空间分离底部控件 */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCompleteActiveSet}
                  className="w-full h-[52px] rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all cursor-pointer shadow-[0_10px_24px_-6px_rgba(0,0,0,0.22)]"
                  style={{
                    backgroundColor: theme.playerPrimaryCtaBg,
                    color: theme.playerPrimaryCtaText,
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

                <div
                  className="rounded-full backdrop-blur-xl p-1 grid grid-cols-3 items-center"
                  style={{
                    backgroundColor: theme.playerGlassBg,
                    border: `1px solid ${theme.playerGlassBorder}`,
                    color: theme.playerGlassText,
                  }}
                >
                  <button
                    type="button"
                    onClick={goToPrevExercise}
                    disabled={!prevExercisePreview}
                    className="min-h-[42px] rounded-full flex items-center justify-center gap-1 text-[12.5px] font-medium disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                    <span>上一动作</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className="min-h-[42px] rounded-full flex items-center justify-center gap-1.5 text-[12.5px] font-medium active:scale-95 transition-all cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? '继续' : '暂停'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={skipCurrentExercise}
                    className="min-h-[42px] rounded-full flex items-center justify-center gap-1 text-[12.5px] font-medium active:scale-95 transition-all cursor-pointer"
                  >
                    <span>跳过动作</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 暂停遮罩 */}
      {isPaused && (
        <div
          className="absolute inset-0 z-40 backdrop-blur-md flex flex-col items-center justify-center px-6 text-center"
          style={{
            backgroundColor: theme.id === 'dynamic' ? 'rgba(30,34,40,0.88)' : 'rgba(250,247,242,0.92)',
            color: theme.id === 'dynamic' ? '#FFFFFF' : theme.textPrimary,
          }}
        >
          <div className="text-[12.5px] font-semibold" style={{ color: theme.accent }}>
            主动暂停 · 已暂停 {pausedSeconds}s
          </div>
          <h2 className="mt-2 text-[24px] font-semibold text-balance">
            暂不记录完成，也不跳过动作
          </h2>
          <p
            className="mt-2 text-[13px]"
            style={{ color: theme.id === 'dynamic' ? '#CFD5E1' : theme.textSecondary }}
          >
            第 {currentRound}/{plan.rounds} 轮 · {currentExercise.name}
          </p>
          <div className="mt-7 w-full space-y-2.5">
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="w-full h-[52px] rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
              style={{
                backgroundColor: theme.primaryCtaBg,
                color: theme.primaryCtaText,
              }}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>继续跟练</span>
            </button>
            <button
              type="button"
              onClick={exitWorkoutEarly}
              className="w-full h-[48px] rounded-full text-[13.5px] font-medium cursor-pointer"
              style={{
                backgroundColor: theme.id === 'dynamic' ? 'rgba(255,255,255,0.12)' : theme.surfaceBg,
                color: theme.id === 'dynamic' ? '#FFFFFF' : theme.textPrimary,
              }}
            >
              提前结束训练（已录 {loggedSets.length} 组）
            </button>
          </div>
        </div>
      )}

      {/* 退出确认抽屉 */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 bg-black/45 backdrop-blur-xs flex flex-col justify-end">
          <div
            className={`rounded-t-3xl p-5 ${bottomSafePad}`}
            style={{
              backgroundColor: theme.canvasBg,
              color: theme.textPrimary,
              borderTop: `1px solid ${theme.hairlineBorder}`,
            }}
          >
            <div
              className="mx-auto mb-3 h-1 w-10 rounded-full"
              style={{ backgroundColor: theme.hairlineBorder }}
            />
            <h3 className="text-[17px] font-semibold">确认退出本次训练？</h3>
            <p className="mt-1.5 text-[13px] leading-[1.55]" style={{ color: theme.textSecondary }}>
              {loggedSets.length === 0
                ? '尚未记录任何完成组，退出将标记为「提前结束（完成 0 组）」，不计入完成次数。'
                : `已实录 ${loggedSets.length} 组，退出将保存实录并记为「提前结束（部分完成）」。`}
            </p>
            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full h-12 rounded-full text-[14.5px] font-semibold cursor-pointer"
                style={{
                  backgroundColor: theme.primaryCtaBg,
                  color: theme.primaryCtaText,
                }}
              >
                继续当前训练
              </button>
              <button
                type="button"
                onClick={exitWorkoutEarly}
                className="w-full h-12 rounded-full text-[14px] font-medium cursor-pointer"
                style={{
                  backgroundColor: theme.surfaceBg,
                  color: theme.textPrimary,
                }}
              >
                提前结束并查看总结
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
