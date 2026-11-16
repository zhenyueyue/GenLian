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
import { getPolishedExerciseMedia, POLISHED_PLAN_MEDIA } from './polishedMedia';

interface PolishedPlayerViewProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
  onFinishToArchive: () => void;
}

const EFFORT_OPTIONS: EffortLevel[] = ['轻松', '正好', '吃力'];

/**
 * 2. 训练进行中（全屏沉浸运动舞台 × 暮色暖白质感体系）
 * - 借鉴 B1.5 全屏动作舞台结构：9:16 居家动作摄影铺满全屏（零黑底断层），控件自然悬浮于画面上方
 * - 极轻盈边缘护眼暗角（仅底部 26% 渐隐承托字幕与悬浮按钮），中段人物与哑铃姿态 100% 锐利可见
 * - 覆盖「动作切换」「进行中 ↔ 组间休息」「结束收入档案」全链路流畅连续过渡
 */
export const PolishedPlayerView: React.FC<PolishedPlayerViewProps> = ({
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

  // 训练完成 / 提前结束总结页（与首页/跟练一致的克制余韵与编辑式数字层次）
  if (phase === 'summary') {
    const isCompleted = sessionOutcome === 'completed';
    const isZeroExit = sessionOutcome === 'early_exit_zero';
    const totalActualReps = loggedSets.reduce((acc, s) => acc + s.actualReps, 0);
    const planMedia = POLISHED_PLAN_MEDIA[plan.id] ?? POLISHED_PLAN_MEDIA['strength-a'];

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
        className="relative flex h-full flex-col bg-[#11100F] text-[#F2EDE4]"
      >
        <div className={`iphone-scroll flex-1 overflow-y-auto ${isSE ? 'pb-28' : 'pb-32'}`}>
          {/* 大气暮色余韵头图 */}
          <div className={`relative w-full overflow-hidden bg-[#1A1816] ${isSE ? 'h-[245px]' : 'h-[285px]'}`}>
            <img
              src={planMedia.wideUrl}
              alt={plan.title}
              referrerPolicy="no-referrer"
              className={`h-full w-full object-cover object-center ${
                isZeroExit ? 'grayscale brightness-[0.52]' : 'brightness-[0.88]'
              }`}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(17,16,15,0.42) 0%, rgba(17,16,15,0) 36%, rgba(17,16,15,0.78) 80%, #11100F 100%)',
              }}
            />

            <div className={`absolute inset-x-0 bottom-0 px-5 pb-4 ${topSafePad}`}>
              <div
                className={`text-[12px] font-medium tracking-[0.02em] ${
                  isCompleted
                    ? 'text-[#D9BE94]'
                    : isZeroExit
                    ? 'text-[#B8AFA4]'
                    : 'text-[#D88A38]'
                }`}
              >
                {isCompleted
                  ? '今日训练完整完成'
                  : isZeroExit
                  ? '提前结束 · 完成 0 组'
                  : '提前结束 · 保留部分实录'}
              </div>
              <h1 className="mt-1.5 text-[26px] font-semibold leading-[1.18] tracking-[-0.015em] text-[#F2EDE4] text-balance">
                {isCompleted
                  ? '按计划完成全部轮次'
                  : isZeroExit
                  ? '未计入完整课程完成次数'
                  : '已记下本次完成组，不影响节奏'}
              </h1>
              <div className="mt-2 font-mono-num text-[12px] text-[#C7BFB4]">
                {plan.category} · {sessionStartedAt || '--:--'} → {sessionEndedAt || '--:--'} · 暂停{' '}
                {pausedSeconds}s
              </div>
            </div>
          </div>

          <div className="px-5">
            {/* 雕塑感核心训练度量（告别密集表单） */}
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-[#F2EDE4]/10">
              <div>
                <div className="font-display-b text-[32px] font-semibold leading-none text-[#F2EDE4] tabular-nums">
                  {loggedSets.length}
                </div>
                <div className="text-[12px] text-[#948B80] mt-2">完成组数</div>
              </div>
              <div>
                <div className="font-display-b text-[32px] font-semibold leading-none text-[#F2EDE4] tabular-nums">
                  {totalActualReps}
                </div>
                <div className="text-[12px] text-[#948B80] mt-2">累计次数/秒</div>
              </div>
              <div>
                <div className="font-display-b text-[32px] font-semibold leading-none text-[#D9BE94] tabular-nums">
                  {formatTimeMMSS(elapsedSeconds)}
                </div>
                <div className="text-[12px] text-[#948B80] mt-2">有效时长</div>
              </div>
            </div>

            {/* 按轮次编排的逐组实录 */}
            <div className="mt-6">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-[15px] font-semibold text-[#F2EDE4]">本次训练实录</span>
                <span className="font-mono-num text-[12px] text-[#948B80]">
                  共 {loggedSets.length} 组
                </span>
              </div>

              {loggedSets.length === 0 ? (
                <div className="rounded-2xl bg-[#191715] p-4 text-[13px] text-[#B8AFA4] leading-[1.6]">
                  本次未记录任何完成组，系统不会伪造训练容量，也不会计入完整课程完成次数。
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedRounds.map(([roundNum, items]) => (
                    <div key={roundNum}>
                      <div className="text-[12px] font-medium text-[#D9BE94] pb-1.5 border-b border-[#F2EDE4]/8">
                        第 {roundNum} 轮
                      </div>
                      <div className="divide-y divide-[#F2EDE4]/6">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="py-3.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="text-[14.5px] font-medium text-[#F2EDE4] truncate">
                                {item.exerciseName}
                                {item.side === 'left'
                                  ? ' · 左侧'
                                  : item.side === 'right'
                                  ? ' · 右侧'
                                  : ''}
                              </div>
                              <div className="mt-0.5 font-mono-num text-[12px] text-[#948B80]">
                                {item.weightUsed} · 休息 {item.actualRestSeconds}s
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-display-b text-[18px] font-semibold text-[#F2EDE4] tabular-nums leading-tight">
                                {item.actualReps}{' '}
                                <span className="text-[12px] font-normal text-[#B8AFA4]">
                                  /{item.targetReps} {item.unit}
                                </span>
                              </div>
                              <div className="text-[12px] text-[#D9BE94] mt-0.5">{item.effort}</div>
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
                <div className="text-[13px] font-semibold text-[#D88A38] mb-2">
                  跳过动作（{skippedRecords.length} 项 · 未计为完成）
                </div>
                <div className="space-y-1.5">
                  {skippedRecords.map((sk, idx) => (
                    <div
                      key={`${sk.timestamp}-${idx}`}
                      className="rounded-xl bg-[#191715] px-3.5 py-2.5 text-[12.5px] text-[#B8AFA4] flex items-center justify-between"
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
          className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#11100F] via-[#11100F]/96 to-transparent px-5 pt-5 ${bottomSafePad}`}
        >
          <button
            type="button"
            onClick={onFinishToArchive}
            className="w-full h-[52px] rounded-full bg-[#F2EDE4] text-[#11100F] text-[15px] font-semibold hover:bg-white active:scale-[0.985] transition-all cursor-pointer shadow-[0_10px_28px_-6px_rgba(0,0,0,0.65)]"
          >
            收入个人训练档案
          </button>
        </div>
      </motion.div>
    );
  }

  const hasRealVideo = Boolean(activeVideoUrl) && !videoLoadFailed;
  const exerciseMedia = getPolishedExerciseMedia(currentExercise);
  const latestLogged = loggedSets[loggedSets.length - 1];
  const restProgressPct =
    restTargetTotal > 0 ? Math.max(0, Math.min(1, restRemaining / restTargetTotal)) : 0;
  const repsModified = repDraft !== currentExercise.targetReps;

  const isActivePhase = phase === 'active';
  const isPreparePhase = phase === 'prepare';
  const isSetCompletePhase = phase === 'setComplete';
  const isRestPhase = phase === 'rest';
  const isNextTransitionPhase = phase === 'nextTransition';

  // 沉浸舞台明暗呼吸感：active 时全透亮；进入 setComplete / rest / nextTransition 时空间自然暗场收束
  const mediaToneClass = isRestPhase
    ? 'scale-[1.03] brightness-[0.30] saturate-[0.55]'
    : isSetCompletePhase
    ? 'scale-[1.015] brightness-[0.45] saturate-[0.75]'
    : isPreparePhase || isNextTransitionPhase
    ? 'scale-[1.01] brightness-[0.54] saturate-[0.8]'
    : 'scale-100 brightness-100 saturate-100';

  const nextRestAsset = nextExerciseAfterRest
    ? getPolishedExerciseMedia(nextExerciseAfterRest)
    : null;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0.75 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0.45 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full flex-col overflow-hidden bg-[#11100F] text-[#F2EDE4]"
    >
      {/* Layer 0: 100% 全屏铺满居家运动舞台（与动作详情共享 layoutId 扩展过渡，且动作切换采用 sync 交叉溶入） */}
      <motion.div
        layoutId={reduceMotion ? undefined : 'cinematic-stage-media'}
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
              className={`h-full w-full object-cover object-center transition-all duration-500 ease-out ${mediaToneClass}`}
            />
          ) : (
            <div
              className={`flex h-full w-full flex-col items-center justify-center bg-[#151412] px-8 text-center transition-all duration-500 ${mediaToneClass}`}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#F2EDE4]/6 border border-[#F2EDE4]/12 flex items-center justify-center text-[#B8AFA4] mb-4">
                <Film className="w-7 h-7" />
              </div>
              <div className="text-[14.5px] font-semibold text-[#F2EDE4]">暂无该动作实拍视频</div>
              <div className="mt-1.5 text-[12.5px] text-[#B8AFA4] leading-[1.5] max-w-[240px]">
                请依据下方动作要领与目标肌群自行掌握动作幅度与呼吸节奏
              </div>
            </div>
          )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Layer 1: 极克制边缘保护暗角（绝不变成下半部分大黑块，保留地面与房间空间贯穿到底） */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#11100F]/56 via-[#11100F]/18 to-transparent" />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 transition-all duration-300 ${
          isActivePhase ? (isSE ? 'h-[28%]' : 'h-[25%]') : 'h-[48%]'
        } bg-gradient-to-t from-[#11100F]/72 via-[#11100F]/24 to-transparent`}
      />

      {isSetCompletePhase && (
        <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-[#D9BE94]/55 transition-opacity" />
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
                className={`h-[2.5px] rounded-full transition-colors ${
                  done ? 'bg-[#D9BE94]' : curr ? 'bg-[#F2EDE4]' : 'bg-[#F2EDE4]/24'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="min-h-[40px] pl-2.5 pr-3.5 rounded-full bg-[#1A1816]/46 backdrop-blur-xl border border-[#F2EDE4]/16 text-[12.5px] font-medium text-[#F2EDE4] flex items-center gap-0.5 whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#1A1816]/68 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>退出</span>
          </button>

          <div className="font-mono-num text-[12px] font-medium text-[#F2EDE4] [text-shadow:0_1px_8px_rgba(0,0,0,0.85)] whitespace-nowrap truncate">
            <span>第 {currentRound}/{plan.rounds} 轮</span>
            <span className="mx-1.5 text-[#F2EDE4]/45" aria-hidden="true">·</span>
            <span>动作 {exerciseIdx + 1}/{totalExercisesInRound}</span>
            <span className="mx-1.5 text-[#F2EDE4]/45" aria-hidden="true">·</span>
            <span className="text-[#D9BE94]">{formatTimeMMSS(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label="语音提示开关"
            className={`min-h-[40px] min-w-[40px] rounded-full bg-[#1A1816]/46 backdrop-blur-xl border border-[#F2EDE4]/16 flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#1A1816]/68 active:scale-95 transition-all ${
              soundEnabled ? 'text-[#F2EDE4]' : 'text-[#F2EDE4]/45'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {(isActivePhase || isPreparePhase) && (
          <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-[#E3DDD4]/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.85)]">
            <span className="truncate">
              {hasRealVideo
                ? '示范循环中 · 按自身节奏发力（不锁速）'
                : '居家实景姿态参考 · 按自身节奏发力'}
            </span>
            {isDebugPreviewMode && (
              <span className="shrink-0 font-mono-num text-[#D88A38]">[预览]</span>
            )}
          </div>
        )}
      </div>

      {/* Layer 3: 中央状态舞台（active 时完全留白给人物与动作幅度） */}
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
              <div className="text-[12.5px] font-medium text-[#D9BE94]">
                第 {currentRound} 轮 · 准备就位
              </div>
              <h1 className="mt-1.5 text-[27px] font-semibold leading-[1.2] text-[#F2EDE4]">
                {currentExercise.name}
              </h1>
              <div
                className={`font-display-b mt-5 font-semibold leading-none tabular-nums ${
                  isSE ? 'text-[74px]' : 'text-[88px]'
                } ${prepareRemaining <= 3 ? 'text-[#B54B35]' : 'text-[#F2EDE4]'}`}
              >
                {prepareRemaining}
              </div>
              <p className="mt-4 text-[13px] text-[#E3DDD4] leading-[1.55]">
                {currentExercise.nextPrepCue}
              </p>
              <div className="mt-2 font-mono-num text-[12px] text-[#D9BE94]">
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
              transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center text-center"
            >
              {!restTriggeredBySet && loggedSets.length === 0 && (
                <div className="mb-2.5 text-[12px] font-medium text-[#D88A38]">
                  未记录完成组（休息预览态 · 不写入档案）
                </div>
              )}

              <div className="text-[12.5px] font-medium text-[#D9BE94]">
                {restKind === 'round' ? `第 ${currentRound} 轮已完成 · 轮间恢复` : '组间安静恢复'}
              </div>

              <div
                className={`font-display-b mt-2 font-semibold leading-none tabular-nums tracking-[-0.03em] transition-colors ${
                  isSE ? 'text-[74px]' : 'text-[90px]'
                } ${restRemaining <= 3 ? 'text-[#B54B35]' : 'text-[#F2EDE4]'}`}
              >
                {restWaitingManual ? '就绪' : formatTimeMMSS(restRemaining)}
              </div>

              <div className="mt-4 w-48 h-[2px] rounded-full bg-[#F2EDE4]/18 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-linear ${
                    restRemaining <= 3 ? 'bg-[#B54B35]' : 'bg-[#D9BE94]'
                  }`}
                  style={{ width: `${restProgressPct * 100}%` }}
                />
              </div>

              <div className="mt-2.5 font-mono-num text-[12px] text-[#C7BFB4]">
                已实休 {actualRestElapsed}s · 设定 {restTargetTotal}s
                {restWaitingManual ? ' · 等待手动开练' : ''}
              </div>

              {nextExerciseAfterRest && nextRestAsset && (
                <div className="mt-7 w-full max-w-[332px] rounded-2xl bg-[#1A1816]/72 backdrop-blur-xl border border-[#F2EDE4]/14 p-3 flex items-center gap-3 text-left">
                  <div className="w-[84px] aspect-[16/9] rounded-lg overflow-hidden shrink-0 bg-[#23201D]">
                    <img
                      src={nextRestAsset.wideUrl}
                      alt={nextExerciseAfterRest.name}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full object-cover ${
                        nextRestAsset.focalClass ?? 'object-center'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-[#D9BE94] font-medium">
                      {isLastExInRound
                        ? `下一个 · 第 ${currentRound + 1} 轮 01`
                        : `下一个动作 · 0${exerciseIdx + 2}`}
                    </div>
                    <div className="text-[14.5px] font-semibold text-[#F2EDE4] truncate mt-0.5">
                      {nextExerciseAfterRest.name}
                    </div>
                    <div className="font-mono-num text-[12px] text-[#B8AFA4] truncate mt-0.5">
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
              <div className="text-[12.5px] font-medium text-[#D9BE94]">
                {exerciseIdx === 0 && currentRound > 1
                  ? `第 ${currentRound - 1} 轮完成 · 开启第 ${currentRound} 轮`
                  : `切换动作 · 0${exerciseIdx + 1}/0${totalExercisesInRound}`}
              </div>
              <h1 className="mt-1.5 text-[28px] font-semibold leading-[1.2] text-[#F2EDE4]">
                {currentExercise.name}
              </h1>
              <div className="mt-2 font-mono-num text-[12.5px] text-[#D8D0C5]">
                {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 目标{' '}
                {currentExercise.targetReps} {currentExercise.unit}
                {currentExercise.isUnilateral ? ' · 左侧先开始' : ''}
              </div>
              <p className="mt-3 text-[13px] text-[#C7BFB4] leading-[1.55]">
                {currentExercise.nextPrepCue}
              </p>
              <div className="font-display-b mt-4 text-[54px] font-semibold leading-none text-[#D9BE94] tabular-nums">
                {transitionSec}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Layer 4: 底部悬浮操作层（自然浮于房间地面画面上，保持实色高对比主完成键 + 轻盈玻璃次级栏） */}
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
                className="w-full h-[52px] rounded-full bg-[#F2EDE4] text-[#11100F] text-[15px] font-semibold cursor-pointer active:scale-[0.985] transition-transform shadow-[0_8px_24px_-6px_rgba(0,0,0,0.45)]"
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
                className="w-full h-[52px] rounded-full bg-[#F2EDE4] text-[#11100F] text-[15px] font-semibold cursor-pointer active:scale-[0.985] transition-transform shadow-[0_8px_24px_-6px_rgba(0,0,0,0.45)]"
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
                className="h-[52px] px-4 rounded-full bg-[#1A1816]/52 backdrop-blur-xl border border-[#F2EDE4]/16 font-mono-num text-[13.5px] font-semibold text-[#F2EDE4] cursor-pointer active:scale-95 transition-transform"
              >
                -15s
              </button>
              <button
                type="button"
                onClick={() => adjustActiveRest(15)}
                className="h-[52px] px-4 rounded-full bg-[#1A1816]/52 backdrop-blur-xl border border-[#F2EDE4]/16 font-mono-num text-[13.5px] font-semibold text-[#F2EDE4] cursor-pointer active:scale-95 transition-transform"
              >
                +15s
              </button>
              <button
                type="button"
                onClick={skipRestToNext}
                className="flex-1 h-[52px] rounded-full bg-[#F2EDE4] text-[#11100F] text-[14.5px] font-semibold cursor-pointer active:scale-[0.985] transition-transform shadow-[0_8px_24px_-6px_rgba(0,0,0,0.45)]"
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
              className="rounded-3xl bg-[#1A1816]/78 backdrop-blur-xl border border-[#D9BE94]/28 p-4 space-y-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.5)]"
            >
              {latestLogged ? (
                <>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold text-[#D9BE94]">
                      本组已实录 · {latestLogged.exerciseName}
                    </span>
                    <span className="font-mono-num text-[#B8AFA4]">
                      {autoAdvancePaused ? '已暂停自动倒数' : `${setCompleteAutoSec}s 后进休息`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#D8D0C5]">微调实做次数</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateLatestSetReps(-1)}
                        className="h-11 w-11 rounded-full bg-[#F2EDE4]/10 hover:bg-[#F2EDE4]/16 text-[#F2EDE4] font-mono-num text-[18px] font-semibold cursor-pointer"
                      >
                        −
                      </button>
                      <span className="font-display-b text-[28px] font-semibold text-[#F2EDE4] tabular-nums min-w-[44px] text-center">
                        {latestLogged.actualReps}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateLatestSetReps(1)}
                        className="h-11 w-11 rounded-full bg-[#F2EDE4]/10 hover:bg-[#F2EDE4]/16 text-[#F2EDE4] font-mono-num text-[18px] font-semibold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {EFFORT_OPTIONS.map((ef) => (
                      <button
                        key={ef}
                        type="button"
                        onClick={() => updateLatestSetEffort(ef)}
                        className={`h-10 rounded-full text-[13px] font-medium cursor-pointer transition-colors ${
                          latestLogged.effort === ef
                            ? 'bg-[#D9BE94] text-[#11100F] font-semibold'
                            : 'bg-[#F2EDE4]/10 text-[#C7BFB4] hover:text-[#F2EDE4]'
                        }`}
                      >
                        {ef}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={goToRestNow}
                    className="w-full h-[50px] rounded-full bg-[#F2EDE4] text-[#11100F] text-[14.5px] font-semibold cursor-pointer active:scale-[0.985] transition-transform"
                  >
                    {autoAdvancePaused ? '进入组间休息' : `立即进入休息 (${setCompleteAutoSec}s)`}
                  </button>
                </>
              ) : (
                <div className="space-y-3 text-center">
                  <div className="text-[12.5px] text-[#C7BFB4] leading-relaxed">
                    尚未记录完成组（不伪造实录），请先在动作进行中点击「完成本动作」
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhase('active')}
                    className="w-full h-12 rounded-full bg-[#F2EDE4] text-[#11100F] text-[14px] font-semibold cursor-pointer"
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
                      <div className="mb-2 inline-flex items-center p-0.5 rounded-full bg-[#1A1816]/55 backdrop-blur-xl border border-[#F2EDE4]/16">
                        <button
                          type="button"
                          onClick={() => setCurrentSide('left')}
                          className={`min-h-[30px] px-3 rounded-full text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                            currentSide === 'left'
                              ? 'bg-[#D9BE94] text-[#11100F] font-semibold'
                              : 'text-[#D8D0C5] hover:text-[#F2EDE4]'
                          }`}
                        >
                          左侧 {currentSide === 'right' ? '✓' : '进行中'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentSide('right')}
                          className={`min-h-[30px] px-3 rounded-full text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                            currentSide === 'right'
                              ? 'bg-[#D9BE94] text-[#11100F] font-semibold'
                              : 'text-[#D8D0C5] hover:text-[#F2EDE4]'
                          }`}
                        >
                          右侧
                        </button>
                      </div>
                    )}

                    <div className="text-[12px] font-medium text-[#D9BE94] truncate [text-shadow:0_1px_6px_rgba(0,0,0,0.85)]">
                      {currentExercise.muscleGroup} ·{' '}
                      {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 节奏{' '}
                      {currentExercise.tempo}
                    </div>

                    <h1
                      className={`mt-0.5 font-semibold leading-[1.18] text-[#F2EDE4] truncate [text-shadow:0_2px_12px_rgba(0,0,0,0.9)] ${
                        isSE ? 'text-[22px]' : 'text-[25px]'
                      }`}
                    >
                      {currentExercise.name}
                    </h1>

                    <p className="mt-1 text-[12.5px] text-[#E3DDD4] line-clamp-1 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
                      {soundEnabled ? currentExercise.voiceCue : currentExercise.targetMuscle}
                    </p>

                    {hasRealVideo && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={replayCurrentVideo}
                          className="min-h-[34px] px-3 rounded-full bg-[#1A1816]/52 backdrop-blur-xl border border-[#F2EDE4]/16 text-[12px] font-medium text-[#F2EDE4] flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>重播</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoMuted(!videoMuted)}
                          className="min-h-[34px] px-3 rounded-full bg-[#1A1816]/52 backdrop-blur-xl border border-[#F2EDE4]/16 text-[12px] font-medium text-[#F2EDE4] flex items-center gap-1 cursor-pointer"
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
                <div className="shrink-0 flex flex-col items-center rounded-full bg-[#1A1816]/50 backdrop-blur-xl border border-[#F2EDE4]/18 p-1 shadow-[0_10px_28px_rgba(0,0,0,0.35)]">
                  <button
                    type="button"
                    onClick={() => setRepDraft((r) => r + 1)}
                    aria-label="增加次数"
                    className="h-11 w-11 rounded-full hover:bg-[#F2EDE4]/12 active:scale-90 text-[#F2EDE4] font-mono-num text-[18px] font-semibold flex items-center justify-center cursor-pointer transition-all"
                  >
                    +
                  </button>
                  <div className="w-6 h-[1px] bg-[#F2EDE4]/16" />
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
                      className={`font-display-b text-[26px] font-semibold leading-none tabular-nums ${
                        repsModified ? 'text-[#D9BE94]' : 'text-[#F2EDE4]'
                      }`}
                    >
                      {repDraft}
                    </motion.div>
                    <div className="text-[10.5px] font-mono-num text-[#D8D0C5] mt-0.5 flex items-center justify-center gap-0.5">
                      {repsModified ? (
                        <>
                          <RotateCcw className="w-2.5 h-2.5 text-[#D9BE94]" />
                          <span className="text-[#D9BE94]">{currentExercise.targetReps}</span>
                        </>
                      ) : (
                        <span>{currentExercise.unit}</span>
                      )}
                    </div>
                  </button>
                  <div className="w-6 h-[1px] bg-[#F2EDE4]/16" />
                  <button
                    type="button"
                    onClick={() => setRepDraft((r) => Math.max(1, r - 1))}
                    aria-label="减少次数"
                    className="h-11 w-11 rounded-full hover:bg-[#F2EDE4]/12 active:scale-90 text-[#F2EDE4] font-mono-num text-[18px] font-semibold flex items-center justify-center cursor-pointer transition-all"
                  >
                    −
                  </button>
                </div>
              </div>

              {/* 空间分离底部控件：高对比暖象牙白主操作钮 + 轻透悬浮次级三联栏 */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCompleteActiveSet}
                  className="w-full h-[52px] rounded-full bg-[#F2EDE4] text-[#11100F] text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-white active:scale-[0.985] transition-all cursor-pointer shadow-[0_10px_28px_-6px_rgba(0,0,0,0.48)]"
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

                <div className="rounded-full bg-[#1A1816]/48 backdrop-blur-xl border border-[#F2EDE4]/14 p-1 grid grid-cols-3 items-center text-[#F2EDE4]">
                  <button
                    type="button"
                    onClick={goToPrevExercise}
                    disabled={!prevExercisePreview}
                    className="min-h-[42px] rounded-full flex items-center justify-center gap-1 text-[12.5px] font-medium disabled:opacity-30 hover:bg-[#F2EDE4]/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                    <span>上一动作</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className="min-h-[42px] rounded-full flex items-center justify-center gap-1.5 text-[12.5px] font-medium hover:bg-[#F2EDE4]/10 active:scale-95 transition-all cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? '继续' : '暂停'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={skipCurrentExercise}
                    className="min-h-[42px] rounded-full flex items-center justify-center gap-1 text-[12.5px] font-medium hover:bg-[#F2EDE4]/10 active:scale-95 transition-all cursor-pointer"
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
        <div className="absolute inset-0 z-40 bg-[#11100F]/88 backdrop-blur-md flex flex-col items-center justify-center px-6 text-center">
          <div className="text-[12.5px] font-medium text-[#D9BE94]">
            主动暂停 · 已暂停 {pausedSeconds}s
          </div>
          <h2 className="mt-2 text-[24px] font-semibold text-[#F2EDE4] text-balance">
            暂不记录完成，也不跳过动作
          </h2>
          <p className="mt-2 text-[13px] text-[#B8AFA4]">
            第 {currentRound}/{plan.rounds} 轮 · {currentExercise.name}
          </p>
          <div className="mt-7 w-full space-y-2.5">
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="w-full h-[52px] rounded-full bg-[#F2EDE4] text-[#11100F] text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>继续跟练</span>
            </button>
            <button
              type="button"
              onClick={exitWorkoutEarly}
              className="w-full h-[48px] rounded-full bg-[#23201D] text-[13.5px] font-medium text-[#F2EDE4] cursor-pointer"
            >
              提前结束训练（已录 {loggedSets.length} 组）
            </button>
          </div>
        </div>
      )}

      {/* 退出确认抽屉 */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 bg-[#11100F]/80 backdrop-blur-xs flex flex-col justify-end">
          <div className={`rounded-t-3xl bg-[#1A1816] border-t border-[#F2EDE4]/12 p-5 ${bottomSafePad}`}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#F2EDE4]/20" />
            <h3 className="text-[17px] font-semibold text-[#F2EDE4]">确认退出本次训练？</h3>
            <p className="mt-1.5 text-[13px] text-[#B8AFA4] leading-[1.55]">
              {loggedSets.length === 0
                ? '尚未记录任何完成组，退出将标记为「提前结束（完成 0 组）」，不计入完成次数。'
                : `已实录 ${loggedSets.length} 组，退出将保存实录并记为「提前结束（部分完成）」。`}
            </p>
            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full h-12 rounded-full bg-[#F2EDE4] text-[#11100F] text-[14.5px] font-semibold cursor-pointer"
              >
                继续当前训练
              </button>
              <button
                type="button"
                onClick={exitWorkoutEarly}
                className="w-full h-12 rounded-full bg-[#23201D] text-[#F2EDE4] text-[14px] font-medium cursor-pointer"
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
