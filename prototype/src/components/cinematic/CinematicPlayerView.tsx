import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
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
import { CINEMA_POSTER_BY_PLAN } from './cinematicMedia';

interface CinematicPlayerViewProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
}

const EFFORT_OPTIONS: EffortLevel[] = ['轻松', '正好', '吃力'];

/**
 * 「训练进行中」全屏运动播放器（Cinematic Fitness）
 * - 统一全周期（准备 / 进行中 / 完成一组 / 组间休息 / 下一动作 / 总结）为电影质感舞台
 * - 保持动作演示 100% 锐利清晰与低干扰轻盈悬浮控件，严禁牺牲动作准确性与触控安全性
 */
export const CinematicPlayerView: React.FC<CinematicPlayerViewProps> = ({
  sim,
  deviceSize,
  reduceMotion = false,
}) => {
  const {
    phase,
    isDebugPreviewMode,
    plan,
    planIndex,
    selectPlan,
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
    if (isPaused || phase !== 'active') {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
  }, [isPaused, phase, activeVideoUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !activeVideoUrl) return;
    el.currentTime = 0;
    if (!isPaused && phase === 'active') {
      el.play().catch(() => {});
    }
  }, [videoReplayToken, currentExercise.id, activeVideoUrl, isPaused, phase]);

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[50px]';
  const bottomSafePad = isSE ? 'pb-4' : 'pb-7';

  // 散场训练总结幕
  if (phase === 'summary') {
    const isCompleted = sessionOutcome === 'completed';
    const isZeroExit = sessionOutcome === 'early_exit_zero';
    const totalActualReps = loggedSets.reduce((acc, s) => acc + s.actualReps, 0);
    const planMedia = CINEMA_POSTER_BY_PLAN[plan.id] ?? CINEMA_POSTER_BY_PLAN['strength-a'];

    return (
      <div className="relative flex h-full flex-col bg-[#0B0908] text-[#F4EFE6]">
        <div className={`iphone-scroll flex-1 overflow-y-auto ${isSE ? 'pb-24' : 'pb-28'}`}>
          {/* 顶部 16:9 剧照结语头图 */}
          <div className="relative h-[220px] w-full overflow-hidden bg-[#14110F]">
            <img
              src={planMedia.widescreenStillUrl}
              alt={plan.title}
              referrerPolicy="no-referrer"
              className={`h-full w-full object-cover ${isZeroExit ? 'grayscale brightness-50' : 'brightness-75'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0908] via-[#0B0908]/65 to-[#0B0908]/40" />

            <div className={`absolute inset-x-0 bottom-0 px-5 pb-4 ${topSafePad}`}>
              <div
                className={`text-[12px] font-semibold ${
                  isCompleted
                    ? 'text-[#D9BE94]'
                    : isZeroExit
                    ? 'text-[#A89F94]'
                    : 'text-[#D88A38]'
                }`}
              >
                {isCompleted
                  ? '本片完整完成'
                  : isZeroExit
                  ? '提前结束（完成 0 组）'
                  : '提前结束（部分完成）'}
              </div>
              <h1 className="font-display-a mt-1 text-[30px] font-bold leading-tight text-[#F4EFE6]">
                {isCompleted
                  ? '按计划完成全部轮次'
                  : isZeroExit
                  ? '未计入完整课程完成次数'
                  : '已收入训练档案，不影响后续安排'}
              </h1>
              <div className="mt-1 font-mono-num text-[11.5px] text-[#A89F94]">
                {sessionStartedAt || '--:--:--'} → {sessionEndedAt || '--:--:--'} · 暂停 {pausedSeconds}s
              </div>
            </div>
          </div>

          <div className="px-5">
            {/* 3 项真实统计 */}
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-[#F4EFE6]/10">
              <div>
                <div className="font-mono-num text-[24px] font-bold text-[#F4EFE6]">
                  {loggedSets.length}
                </div>
                <div className="text-[11px] text-[#A89F94] mt-0.5">实录完成组</div>
              </div>
              <div>
                <div className="font-mono-num text-[24px] font-bold text-[#F4EFE6]">
                  {totalActualReps}
                </div>
                <div className="text-[11px] text-[#A89F94] mt-0.5">实录总次数/秒</div>
              </div>
              <div>
                <div className="font-mono-num text-[24px] font-bold text-[#D9BE94]">
                  {formatTimeMMSS(elapsedSeconds)}
                </div>
                <div className="text-[11px] text-[#A89F94] mt-0.5">有效训练时长</div>
              </div>
            </div>

            {/* 逐组实录清单 */}
            <div className="mt-5">
              <div className="text-[13px] font-semibold text-[#F4EFE6] mb-2">
                逐组实录档案（{loggedSets.length} 组）
              </div>
              {loggedSets.length === 0 ? (
                <div className="rounded-xl bg-[#14110F] p-4 text-[12.5px] text-[#A89F94] leading-relaxed">
                  本次未记录任何完成组，系统不伪造训练容量，也不会计入完整课程完成次数。
                </div>
              ) : (
                <div className="divide-y divide-[#F4EFE6]/8">
                  {loggedSets.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-2 text-[12px]">
                      <div className="min-w-0">
                        <div className="font-semibold text-[#F4EFE6] truncate">
                          R{item.round} · {item.exerciseName}
                          {item.side === 'left' ? '（左）' : item.side === 'right' ? '（右）' : ''}
                        </div>
                        <div className="mt-0.5 font-mono-num text-[11px] text-[#A89F94]">
                          {item.weightUsed} · 休息 {item.actualRestSeconds}s · {item.startedAt}-{item.endedAt}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono-num font-bold text-[#D9BE94]">
                          {item.actualReps}/{item.targetReps} {item.unit}
                        </div>
                        <div className="text-[#A89F94]">{item.effort}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {skippedRecords.length > 0 && (
              <div className="mt-5">
                <div className="text-[12.5px] font-semibold text-[#D88A38] mb-2">
                  跳过动作记录（{skippedRecords.length} 项 · 未计为完成）
                </div>
                <div className="space-y-1.5">
                  {skippedRecords.map((sk, idx) => (
                    <div
                      key={`${sk.timestamp}-${idx}`}
                      className="rounded-xl bg-[#14110F] px-3 py-2 text-[12px] text-[#A89F94] flex items-center justify-between"
                    >
                      <span>
                        R{sk.round} · {sk.exerciseName}
                      </span>
                      <span className="font-mono-num text-[11px]">{sk.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0B0908] via-[#0B0908]/95 to-transparent px-5 pt-5 ${bottomSafePad}`}
        >
          <button
            type="button"
            onClick={() => selectPlan(planIndex)}
            className="w-full h-[52px] rounded-xl bg-[#F4EFE6] text-[#0B0908] text-[14.5px] font-bold hover:bg-white active:scale-[0.985] transition-all cursor-pointer"
          >
            完成并收入训练档案
          </button>
        </div>
      </div>
    );
  }

  // 全屏舞台共享媒体解析
  const hasRealVideo = Boolean(activeVideoUrl) && !videoLoadFailed;
  const verifiedStaticPhoto = currentExercise.hasVerifiedPoseImage
    ? currentExercise.verticalImageUrl ?? currentExercise.imageUrl
    : undefined;
  const latestLogged = loggedSets[loggedSets.length - 1];
  const restProgressPct =
    restTargetTotal > 0 ? Math.max(0, Math.min(1, restRemaining / restTargetTotal)) : 0;
  const repsModified = repDraft !== currentExercise.targetReps;

  const isActivePhase = phase === 'active';
  const isPreparePhase = phase === 'prepare';
  const isSetCompletePhase = phase === 'setComplete';
  const isRestPhase = phase === 'rest';
  const isNextTransitionPhase = phase === 'nextTransition';

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#0B0908] text-[#F4EFE6]">
      {/* Layer 0: 100% 全屏示范视频 / 姿态影像 */}
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
            isRestPhase
              ? 'scale-[1.03] brightness-[0.20] saturate-[0.3]'
              : isPreparePhase || isNextTransitionPhase
              ? 'brightness-[0.44]'
              : isSetCompletePhase
              ? 'brightness-[0.34]'
              : 'brightness-100'
          }`}
        />
      ) : verifiedStaticPhoto ? (
        <img
          src={verifiedStaticPhoto}
          alt={currentExercise.name}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ${
            isRestPhase
              ? 'scale-[1.03] brightness-[0.20] saturate-[0.3]'
              : isPreparePhase || isNextTransitionPhase
              ? 'brightness-[0.44]'
              : isSetCompletePhase
              ? 'brightness-[0.34]'
              : 'brightness-100'
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0E0C0A] px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F4EFE6]/5 border border-[#F4EFE6]/10 flex items-center justify-center text-[#A89F94] mb-4">
            <Film className="w-7 h-7" />
          </div>
          <div className="text-[14px] font-semibold text-[#F4EFE6]">暂无该动作实拍示范视频</div>
          <div className="mt-1.5 text-[12px] text-[#A89F94] leading-relaxed max-w-[240px]">
            请依据下方动作要领与目标肌群自行掌握动作幅度与呼吸节奏
          </div>
        </div>
      )}

      {/* Layer 1: 轻盈双向暗角（保留画面中段 100% 锐利透亮） */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0B0908]/75 via-[#0B0908]/28 to-transparent" />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 transition-all duration-300 ${
          isActivePhase
            ? isSE
              ? 'h-[36%]'
              : 'h-[32%]'
            : 'h-[58%]'
        } bg-gradient-to-t from-[#0B0908]/95 via-[#0B0908]/55 to-transparent`}
      />

      {/* 完成一组时顶部微弱香槟金边缘光提示 */}
      {isSetCompletePhase && (
        <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-[#D9BE94]/65" />
      )}

      {/* Layer 2: 顶部章节进度条与极简时间码栏 */}
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
                  done ? 'bg-[#D9BE94]' : curr ? 'bg-[#F4EFE6]' : 'bg-[#F4EFE6]/22'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="min-h-[38px] pl-2.5 pr-3 rounded-lg bg-[#0B0908]/35 backdrop-blur-md border border-[#F4EFE6]/14 text-[12px] font-medium text-[#F4EFE6] flex items-center gap-0.5 whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#0B0908]/55"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>退出</span>
          </button>

          <div className="font-mono-num text-[12px] font-semibold text-[#F4EFE6]/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)] whitespace-nowrap truncate">
            <span>第 {currentRound}/{plan.rounds} 轮</span>
            <span className="mx-1.5 text-[#F4EFE6]/35" aria-hidden="true">·</span>
            <span>0{exerciseIdx + 1}/0{totalExercisesInRound}</span>
            <span className="mx-1.5 text-[#F4EFE6]/35" aria-hidden="true">·</span>
            <span className="text-[#D9BE94]">{formatTimeMMSS(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label="语音提示开关"
            className={`min-h-[38px] min-w-[38px] rounded-lg bg-[#0B0908]/35 backdrop-blur-md border border-[#F4EFE6]/14 flex items-center justify-center shrink-0 cursor-pointer ${
              soundEnabled ? 'text-[#F4EFE6]' : 'text-[#F4EFE6]/45'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#D8D0C5]/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
          <span className="truncate">
            {hasRealVideo
              ? '示范循环中 · 按自身节奏发力，不绑定视频速度'
              : currentExercise.videoMissingNote ?? '静态姿态参考 · 按自身节奏完成次数'}
          </span>
          {isDebugPreviewMode && (
            <span className="shrink-0 font-mono-num text-[#D88A38]">[预览直达]</span>
          )}
        </div>
      </div>

      {/* Layer 3: 中央状态舞台（active 时完全留白给动作示范） */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-5">
        {isPreparePhase && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center max-w-[310px]"
          >
            <div className="text-[12px] font-medium tracking-wider text-[#D9BE94]">
              第 {currentRound} 轮 · 第一幕准备
            </div>
            <h1 className="font-display-a mt-1.5 text-[32px] font-bold leading-tight text-[#F4EFE6]">
              {currentExercise.name}
            </h1>
            <div
              className={`font-display-a mt-5 font-bold leading-none tabular-nums ${
                isSE ? 'text-[76px]' : 'text-[92px]'
              } ${prepareRemaining <= 3 ? 'text-[#BA4832]' : 'text-[#F4EFE6]'}`}
            >
              {prepareRemaining}
            </div>
            <p className="mt-4 text-[13px] text-[#C8C0B5] leading-relaxed">
              {currentExercise.nextPrepCue}
            </p>
            <div className="mt-2 font-mono-num text-[12px] text-[#D9BE94]">
              {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 目标 {currentExercise.targetReps}{' '}
              {currentExercise.unit}
            </div>
          </motion.div>
        )}

        {isRestPhase && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            className="w-full flex flex-col items-center text-center"
          >
            <div className="text-[12px] font-medium text-[#D9BE94]">
              {restKind === 'round' ? '本轮结束 · 轮间恢复' : '组间呼吸恢复'}
            </div>

            <div
              className={`font-display-a mt-2 font-bold leading-none tabular-nums tracking-[-0.02em] transition-colors ${
                isSE ? 'text-[78px]' : 'text-[96px]'
              } ${restRemaining <= 3 ? 'text-[#BA4832]' : 'text-[#F4EFE6]'}`}
            >
              {restWaitingManual ? '就绪' : formatTimeMMSS(restRemaining)}
            </div>

            {/* 极细单一进度条（无厚重圆环表盘） */}
            <div className="mt-3.5 w-44 h-[2px] rounded-full bg-[#F4EFE6]/16 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-linear ${
                  restRemaining <= 3 ? 'bg-[#BA4832]' : 'bg-[#D9BE94]'
                }`}
                style={{ width: `${restProgressPct * 100}%` }}
              />
            </div>

            <div className="mt-2 font-mono-num text-[11px] text-[#A89F94]">
              已实休 {actualRestElapsed}s
              {restWaitingManual ? ' · 等待确认开练' : ''}
            </div>

            {/* 下一幕宽银幕预告卡 */}
            {nextExerciseAfterRest && (
              <div className="mt-8 w-full max-w-[330px] rounded-xl bg-[#14110F]/88 backdrop-blur-md border border-[#F4EFE6]/10 p-3 flex items-center gap-3 text-left">
                <div className="w-[84px] aspect-[16/9] rounded-lg overflow-hidden shrink-0 bg-[#1D1916]">
                  <img
                    src={nextExerciseAfterRest.imageUrl}
                    alt={nextExerciseAfterRest.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-[#D9BE94] font-medium">
                    {isLastExInRound ? `即将进入第 ${currentRound + 1} 轮 · 01` : `下一幕 · 0${exerciseIdx + 2}`}
                  </div>
                  <div className="text-[14.5px] font-semibold text-[#F4EFE6] truncate mt-0.5">
                    {nextExerciseAfterRest.name}
                  </div>
                  <div className="font-mono-num text-[11px] text-[#A89F94] truncate mt-0.5">
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
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22 }}
            className="text-center max-w-[310px]"
          >
            <div className="text-[12px] font-medium text-[#D9BE94]">
              第 {currentRound} 轮 · 0{exerciseIdx + 1}/0{totalExercisesInRound}
            </div>
            <h1 className="font-display-a mt-1.5 text-[34px] font-bold leading-tight text-[#F4EFE6]">
              {currentExercise.name}
            </h1>
            <div className="mt-2 font-mono-num text-[12.5px] text-[#C8C0B5]">
              {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 目标 {currentExercise.targetReps}{' '}
              {currentExercise.unit}
              {currentExercise.isUnilateral ? ' · 左侧先开始' : ''}
            </div>
            <p className="mt-3 text-[12.5px] text-[#A89F94] leading-relaxed">
              {currentExercise.nextPrepCue}
            </p>
            <div className="font-display-a mt-4 text-[56px] font-bold leading-none text-[#D9BE94] tabular-nums">
              {transitionSec}
            </div>
          </motion.div>
        )}
      </div>

      {/* Layer 4: 底部悬浮信息与轻盈交互控制区 */}
      <div className={`relative z-20 px-4 ${bottomSafePad}`}>
        {isPreparePhase && (
          <button
            type="button"
            onClick={skipPreparation}
            className="w-full h-[52px] rounded-xl bg-[#F4EFE6] text-[#0B0908] text-[14.5px] font-bold cursor-pointer active:scale-[0.985] transition-transform"
          >
            立即开始动作
          </button>
        )}

        {isNextTransitionPhase && (
          <button
            type="button"
            onClick={startNextImmediately}
            className="w-full h-[52px] rounded-xl bg-[#F4EFE6] text-[#0B0908] text-[14.5px] font-bold cursor-pointer active:scale-[0.985] transition-transform"
          >
            直接开始本动作
          </button>
        )}

        {isRestPhase && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustActiveRest(-15)}
              className="h-[50px] px-4 rounded-xl bg-[#14110F]/85 backdrop-blur-md border border-[#F4EFE6]/14 font-mono-num text-[13px] font-semibold text-[#F4EFE6] cursor-pointer active:scale-95 transition-transform"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => adjustActiveRest(15)}
              className="h-[50px] px-4 rounded-xl bg-[#14110F]/85 backdrop-blur-md border border-[#F4EFE6]/14 font-mono-num text-[13px] font-semibold text-[#F4EFE6] cursor-pointer active:scale-95 transition-transform"
            >
              +15s
            </button>
            <button
              type="button"
              onClick={skipRestToNext}
              className="flex-1 h-[50px] rounded-xl bg-[#F4EFE6] text-[#0B0908] text-[14px] font-bold cursor-pointer active:scale-[0.985] transition-transform"
            >
              {restWaitingManual ? '开始下一动作' : '提前结束休息'}
            </button>
          </div>
        )}

        {isSetCompletePhase && latestLogged && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl bg-[#14110F]/92 backdrop-blur-lg border border-[#F4EFE6]/12 p-4 space-y-3.5"
          >
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[#D9BE94]">
                本组已记录 · {latestLogged.exerciseName}
              </span>
              <span className="font-mono-num text-[#A89F94]">
                {autoAdvancePaused ? '已暂停自动倒数' : `${setCompleteAutoSec}s 后进休息`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#C8C0B5]">微调实做次数</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateLatestSetReps(-1)}
                  className="h-10 w-10 rounded-lg bg-[#1D1916] text-[#F4EFE6] font-mono-num text-[18px] font-bold cursor-pointer"
                >
                  −
                </button>
                <span className="font-display-a text-[28px] font-bold text-[#F4EFE6] tabular-nums min-w-[44px] text-center">
                  {latestLogged.actualReps}
                </span>
                <button
                  type="button"
                  onClick={() => updateLatestSetReps(1)}
                  className="h-10 w-10 rounded-lg bg-[#1D1916] text-[#F4EFE6] font-mono-num text-[18px] font-bold cursor-pointer"
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
                  className={`h-10 rounded-xl text-[12.5px] font-semibold cursor-pointer transition-colors ${
                    latestLogged.effort === ef
                      ? 'bg-[#D9BE94] text-[#0B0908]'
                      : 'bg-[#1D1916] text-[#A89F94] hover:text-[#F4EFE6]'
                  }`}
                >
                  {ef}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={goToRestNow}
              className="w-full h-[48px] rounded-xl bg-[#F4EFE6] text-[#0B0908] text-[14px] font-bold cursor-pointer"
            >
              {autoAdvancePaused ? '进入组间休息' : `立即进入休息 (${setCompleteAutoSec}s)`}
            </button>
          </motion.div>
        )}

        {isActivePhase && (
          <>
            <div className="flex items-end justify-between gap-3 mb-3.5">
              {/* 左侧动作字幕 */}
              <div className="min-w-0 flex-1">
                {currentExercise.isUnilateral && (
                  <div className="mb-2 inline-flex items-center p-0.5 rounded-lg bg-[#0B0908]/60 backdrop-blur-md border border-[#F4EFE6]/14">
                    <button
                      type="button"
                      onClick={() => setCurrentSide('left')}
                      className={`min-h-[30px] px-3 rounded-md text-[11.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        currentSide === 'left'
                          ? 'bg-[#D9BE94] text-[#0B0908]'
                          : 'text-[#C8C0B5] hover:text-[#F4EFE6]'
                      }`}
                    >
                      左侧 {currentSide === 'right' ? '✓' : '进行中'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentSide('right')}
                      className={`min-h-[30px] px-3 rounded-md text-[11.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        currentSide === 'right'
                          ? 'bg-[#D9BE94] text-[#0B0908]'
                          : 'text-[#C8C0B5] hover:text-[#F4EFE6]'
                      }`}
                    >
                      右侧
                    </button>
                  </div>
                )}

                <div className="text-[11.5px] font-medium text-[#D9BE94] truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {currentExercise.muscleGroup} · {getExerciseWeightLabel(currentExercise.usesDumbbells)} ·
                  节奏 {currentExercise.tempo}
                </div>

                <h1
                  className={`font-display-a mt-0.5 font-bold leading-tight text-[#F4EFE6] truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${
                    isSE ? 'text-[26px]' : 'text-[30px]'
                  }`}
                >
                  {currentExercise.name}
                </h1>

                <p className="mt-0.5 text-[12px] text-[#D8D0C5] line-clamp-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
                  {soundEnabled ? currentExercise.voiceCue : currentExercise.targetMuscle}
                </p>

                {hasRealVideo && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={replayCurrentVideo}
                      className="min-h-[32px] px-2.5 rounded-lg bg-[#0B0908]/45 backdrop-blur-md border border-[#F4EFE6]/14 text-[11px] font-medium text-[#F4EFE6] flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>重播</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMuted(!videoMuted)}
                      className="min-h-[32px] px-2.5 rounded-lg bg-[#0B0908]/45 backdrop-blur-md border border-[#F4EFE6]/14 text-[11px] font-medium text-[#F4EFE6] flex items-center gap-1 cursor-pointer"
                    >
                      {videoMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      <span>{videoMuted ? '已静音' : '原声'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 右侧轻盈竖向次数标尺 */}
              <div className="shrink-0 flex flex-col items-center rounded-2xl bg-[#0B0908]/45 backdrop-blur-md border border-[#F4EFE6]/14 p-1">
                <button
                  type="button"
                  onClick={() => setRepDraft((r) => r + 1)}
                  aria-label="增加次数"
                  className="h-10 w-11 rounded-xl hover:bg-[#F4EFE6]/10 active:scale-90 text-[#F4EFE6] font-mono-num text-[18px] font-bold flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
                <div className="w-6 h-[1px] bg-[#F4EFE6]/12" />
                <button
                  type="button"
                  onClick={() => setRepDraft(currentExercise.targetReps)}
                  title="点击恢复目标次数"
                  className="py-1.5 px-1 text-center min-w-[44px] cursor-pointer"
                >
                  <div
                    className={`font-display-a text-[28px] font-bold leading-none tabular-nums ${
                      repsModified ? 'text-[#D9BE94]' : 'text-[#F4EFE6]'
                    }`}
                  >
                    {repDraft}
                  </div>
                  <div className="text-[9.5px] font-mono-num text-[#A89F94] mt-0.5 flex items-center justify-center gap-0.5">
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
                <div className="w-6 h-[1px] bg-[#F4EFE6]/12" />
                <button
                  type="button"
                  onClick={() => setRepDraft((r) => Math.max(1, r - 1))}
                  aria-label="减少次数"
                  className="h-10 w-11 rounded-xl hover:bg-[#F4EFE6]/10 active:scale-90 text-[#F4EFE6] font-mono-num text-[18px] font-bold flex items-center justify-center cursor-pointer"
                >
                  −
                </button>
              </div>
            </div>

            {/* 低干扰底部控制：象牙白主完成按钮 + 轻盈三联操作条 */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={handleCompleteActiveSet}
                className="w-full h-[52px] rounded-xl bg-[#F4EFE6] text-[#0B0908] text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-white active:scale-[0.985] transition-all cursor-pointer shadow-[0_8px_24px_-6px_rgba(0,0,0,0.65)]"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {currentExercise.isUnilateral && currentSide === 'left'
                    ? `完成左侧 (${repDraft} ${currentExercise.unit}) · 切右侧`
                    : isLastExInRound && isLastRound
                    ? `完成收官组 · 记 ${repDraft} ${currentExercise.unit}`
                    : `完成本动作 · 记 ${repDraft} ${currentExercise.unit}`}
                </span>
              </button>

              <div className="grid grid-cols-3 items-center text-[#D8D0C5]">
                <button
                  type="button"
                  onClick={goToPrevExercise}
                  disabled={!prevExercisePreview}
                  className="min-h-[42px] flex items-center justify-center gap-1 text-[12px] font-medium disabled:opacity-30 hover:text-[#F4EFE6] cursor-pointer"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  <span>上一动作</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="min-h-[42px] flex items-center justify-center gap-1.5 text-[12px] font-medium hover:text-[#F4EFE6] cursor-pointer"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? '继续' : '暂停'}</span>
                </button>
                <button
                  type="button"
                  onClick={skipCurrentExercise}
                  className="min-h-[42px] flex items-center justify-center gap-1 text-[12px] font-medium hover:text-[#F4EFE6] cursor-pointer"
                >
                  <span>跳过动作</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 暂停遮罩 */}
      {isPaused && (
        <div className="absolute inset-0 z-40 bg-[#0B0908]/92 backdrop-blur-md flex flex-col items-center justify-center px-6 text-center">
          <div className="text-[12.5px] font-medium text-[#D9BE94]">
            主动暂停 · 已暂停 {pausedSeconds}s
          </div>
          <h2 className="font-display-a mt-2 text-[30px] font-bold text-[#F4EFE6] text-balance">
            暂不记录完成，也不跳过动作
          </h2>
          <p className="mt-2 text-[13px] text-[#A89F94]">
            第 {currentRound}/{plan.rounds} 轮 · {currentExercise.name}
          </p>
          <div className="mt-7 w-full space-y-2.5">
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="w-full h-[52px] rounded-xl bg-[#F4EFE6] text-[#0B0908] text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>继续跟练</span>
            </button>
            <button
              type="button"
              onClick={exitWorkoutEarly}
              className="w-full h-[48px] rounded-xl bg-[#1D1916] text-[13.5px] font-semibold text-[#F4EFE6] cursor-pointer"
            >
              提前结束训练（已录 {loggedSets.length} 组）
            </button>
          </div>
        </div>
      )}

      {/* 退出确认抽屉 */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 bg-[#0B0908]/80 backdrop-blur-xs flex flex-col justify-end">
          <div className={`rounded-t-3xl bg-[#14110F] border-t border-[#F4EFE6]/12 p-5 ${bottomSafePad}`}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#F4EFE6]/20" />
            <h3 className="text-[17px] font-bold text-[#F4EFE6]">确认退出本次训练？</h3>
            <p className="mt-1.5 text-[13px] text-[#A89F94] leading-relaxed">
              {loggedSets.length === 0
                ? '尚未记录任何完成组，退出将标记为「提前结束（完成 0 组）」，不计入完成次数。'
                : `已实录 ${loggedSets.length} 组，退出将保存实录并记为「提前结束（部分完成）」。`}
            </p>
            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full h-12 rounded-xl bg-[#F4EFE6] text-[#0B0908] text-[14.5px] font-bold cursor-pointer"
              >
                继续当前训练
              </button>
              <button
                type="button"
                onClick={exitWorkoutEarly}
                className="w-full h-12 rounded-xl bg-[#1D1916] text-[#F4EFE6] text-[14px] font-semibold cursor-pointer"
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
