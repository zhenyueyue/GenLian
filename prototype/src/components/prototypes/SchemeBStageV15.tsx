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

interface SchemeBStageV15Props {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
}

/**
 * 方案 B1.5 最终整合版（以 B1 影院全屏舞台为主干，吸收 B2 右缘竖向拇指标尺与系统化悬浮控制质感）
 * 支持真实 <video> 循环示范播放、动作切换重置、静音开关、重新观看，以及无实拍视频时的明确占位状态
 */
export const SchemeBStageV15: React.FC<SchemeBStageV15Props> = ({ sim, deviceSize }) => {
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

  // Sync <video> mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = videoMuted;
    }
  }, [videoMuted, activeVideoUrl]);

  // Sync <video> play/pause with workout pause state & active/prepare/transition phases
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !activeVideoUrl) return;
    if (isPaused || phase === 'rest') {
      el.pause();
    } else {
      el.play().catch(() => {
        // Autoplay policy fallback handled safely
      });
    }
  }, [isPaused, phase, activeVideoUrl]);

  // Replay video from 00:00 on user request or exercise change
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
  const latestLogged = loggedSets[loggedSets.length - 1];
  const hasRealVideo = Boolean(activeVideoUrl) && !videoLoadFailed;
  const verifiedStaticPhoto = currentExercise.hasVerifiedPoseImage
    ? currentExercise.verticalImageUrl ?? currentExercise.imageUrl
    : undefined;

  const isFinal3Sec = phase === 'rest' && restRemaining <= 3 && restRemaining > 0;
  const restRatio = Math.max(0, Math.min(1, restRemaining / Math.max(1, restTargetTotal)));
  const repsModified = repDraft !== currentExercise.targetReps;

  const stageFilterClass =
    phase === 'rest'
      ? 'brightness-[0.16] grayscale-[80%] scale-[1.03]'
      : phase === 'setComplete'
      ? 'brightness-[0.34] scale-[1.015]'
      : phase === 'prepare'
      ? 'brightness-[0.42] scale-[1.01]'
      : phase === 'nextTransition'
      ? 'brightness-[0.52] scale-[1.02]'
      : 'brightness-100 scale-100';

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden bg-[#08090B] text-[#EAE7DC] transition-shadow duration-300 ${
        phase === 'setComplete' ? 'ring-2 ring-inset ring-[#C8F542]/70' : ''
      }`}
    >
      {/* 1. 全屏动作示范层：优先真实循环视频，无素材时展示明确占位态（绝不用错图冒充） */}
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
          className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ${stageFilterClass}`}
        />
      ) : verifiedStaticPhoto ? (
        <img
          src={verifiedStaticPhoto}
          alt={currentExercise.name}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ${stageFilterClass}`}
        />
      ) : (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center bg-[#0C0F14] px-8 text-center transition-all duration-500 ${stageFilterClass}`}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#9A9D9E] mb-4">
            <Film className="w-7 h-7" />
          </div>
          <div className="text-[14px] font-bold text-white">暂无该动作实拍视频或参考图</div>
          <div className="mt-1.5 text-[12px] text-white/60 leading-relaxed max-w-[240px]">
            请依据下方动作要领与目标肌群自行掌握动作幅度与节奏
          </div>
        </div>
      )}

      {/* 顶部保护暗角 + 底部渐进暗角（保持全屏融合感，无中间黑色断层） */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/82 via-black/38 to-transparent" />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#08090B] via-[#08090B]/84 to-transparent transition-all duration-300 ${
          phase === 'active' ? (isSE ? 'h-[48%]' : 'h-[44%]') : 'h-[58%]'
        }`}
      />

      {/* 2. 顶部安全区：极简进度轨道 + 去胶囊化居中排印信息 */}
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
                className={`h-[3.5px] rounded-full transition-colors ${
                  done ? 'bg-[#C8F542]' : curr ? 'bg-white' : 'bg-white/20'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="min-h-[40px] px-3 rounded-full bg-black/45 backdrop-blur-md text-[12px] font-medium text-white flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>退出</span>
          </button>

          {/* 纯文字 + tabular-nums + 柔和文字阴影 */}
          <div className="font-mono-num text-[12px] font-semibold text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)] whitespace-nowrap truncate">
            <span>第 {currentRound}/{plan.rounds} 轮</span>
            <span className="mx-1.5 text-white/45" aria-hidden="true">·</span>
            <span>动作 {exerciseIdx + 1}/{totalExercisesInRound}</span>
            <span className="mx-1.5 text-white/45" aria-hidden="true">·</span>
            <span className="text-[#C8F542]">{formatTimeMMSS(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`min-h-[40px] min-w-[40px] rounded-full backdrop-blur-md flex items-center justify-center shrink-0 transition-colors active:scale-95 ${
              soundEnabled ? 'bg-[#C8F542] text-[#111315]' : 'bg-black/45 text-white'
            }`}
            aria-label="语音与提示音开关"
            title={soundEnabled ? '语音提示：开' : '语音提示：关'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* 媒体状态说明条：明确区分真实循环视频 vs 静态参考占位态，并提示视频不锁速 */}
        {(phase === 'active' || phase === 'prepare') && (
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
            <span className="truncate">
              {hasRealVideo
                ? '示范视频循环播放中 · 按自身节奏完成次数（不锁速）'
                : currentExercise.videoMissingNote ?? '暂无动态示范视频（占位态 · 按自身节奏完成）'}
            </span>
            {isDebugPreviewMode && (
              <span className="shrink-0 font-mono-num text-[#E3A05B]">[调试直达]</span>
            )}
          </div>
        )}
      </div>

      {/* 3. 中央舞台：Active 时留白给动作姿态；Prepare / Rest / Next 时触发明显氛围切换 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5">
        <AnimatePresence mode="wait">
          {phase === 'prepare' && (
            <motion.div
              key="v15-prepare"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="text-center"
            >
              <div className="text-[13px] font-semibold text-[#C8F542]">训练准备 · 摆好姿态</div>
              <h2 className="font-display-b mt-1.5 text-[28px] font-extrabold text-white text-balance">
                {currentExercise.name}
              </h2>
              <div className="my-4 font-display-b text-[86px] font-extrabold leading-none text-[#C8F542] tabular-nums">
                {prepareRemaining}
              </div>
              <p className="text-[13px] text-white/80 max-w-[260px] mx-auto leading-relaxed">
                {currentExercise.nextPrepCue}
              </p>
            </motion.div>
          )}

          {phase === 'rest' && (
            <motion.div
              key="v15-rest"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col items-center text-center w-full"
            >
              {!restTriggeredBySet && loggedSets.length === 0 && (
                <div className="mb-3 text-[11px] font-medium text-[#E3A05B]">
                  未记录完成组（休息预览态 · 不写入实录）
                </div>
              )}

              {/* 克制状态引导语 */}
              <div
                className={`text-[13px] font-medium tracking-wide transition-colors ${
                  isFinal3Sec || restWaitingManual
                    ? 'text-[#C8F542]'
                    : restKind === 'round'
                    ? 'text-[#C8F542]/85'
                    : 'text-white/60'
                }`}
              >
                {restWaitingManual
                  ? '休息已满 · 点击下方开始下一动作'
                  : restKind === 'round'
                  ? `第 ${currentRound} 轮已完成 · 轮间恢复`
                  : '组间安静恢复'}
              </div>

              {/* 绝对视觉中心：超大号等宽倒计时（无硬质圆环） */}
              <div
                className={`font-display-b mt-3 font-extrabold leading-none tracking-[-0.03em] tabular-nums transition-colors duration-300 ${
                  isSE ? 'text-[76px]' : 'text-[92px]'
                } ${isFinal3Sec || restWaitingManual ? 'text-[#C8F542]' : 'text-white'}`}
              >
                {formatTimeMMSS(restRemaining)}
              </div>

              {/* 极细 2px 水平呼吸进度线 */}
              <div className="mt-5 w-full max-w-[232px] h-[2px] rounded-full bg-white/12 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFinal3Sec || restWaitingManual ? 'bg-[#C8F542]' : 'bg-white/75'
                  }`}
                  style={{ width: `${restRatio * 100}%` }}
                />
              </div>

              <div className="mt-2.5 font-mono-num text-[11.5px] text-white/45 flex items-center gap-2">
                <span>实休 {actualRestElapsed}s</span>
                <span aria-hidden="true">·</span>
                <span>设定 {restTargetTotal}s</span>
              </div>

              {/* 保留下个动作预告卡片，弱化边框存在感融入深色呼吸空间 */}
              {nextExerciseAfterRest && (
                <div className="mt-8 flex items-center gap-3 bg-[#14171B]/68 backdrop-blur-xl border border-white/8 rounded-2xl p-2.5 max-w-[324px] w-full text-left">
                  <img
                    src={nextExerciseAfterRest.imageUrl}
                    alt={nextExerciseAfterRest.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover shrink-0 bg-[#1A1D21]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[#C8F542] font-semibold truncate">
                      即将开始 · {nextExerciseAfterRest.targetReps} {nextExerciseAfterRest.unit}
                      {nextExerciseAfterRest.isUnilateral ? '（单臂左右）' : ''}
                    </div>
                    <div className="text-[14px] font-bold text-white truncate">
                      {nextExerciseAfterRest.name}
                    </div>
                    <div className="text-[11px] text-white/55 truncate">
                      {nextExerciseAfterRest.nextPrepCue}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {phase === 'nextTransition' && (
            <motion.div
              key="v15-next"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center max-w-[320px]"
            >
              <div className="text-[13px] font-semibold text-[#C8F542]">
                {exerciseIdx === 0 && currentRound > 1
                  ? `第 ${currentRound - 1} 轮完成 · 开启第 ${currentRound} 轮`
                  : `重新聚焦 · 动作 ${exerciseIdx + 1}/${totalExercisesInRound}`}
              </div>
              <h2 className="font-display-b mt-2 text-[32px] font-extrabold leading-tight text-white text-balance">
                {currentExercise.name}
              </h2>
              <div className="mt-1.5 text-[12.5px] font-medium text-white/75">
                {currentExercise.muscleGroup} · {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 目标 {currentExercise.targetReps} {currentExercise.unit}
              </div>
              <p className="mt-2.5 text-[13.5px] text-white/85 leading-relaxed">
                {currentExercise.nextPrepCue}
              </p>
              <div className="mt-4 font-display-b text-[52px] font-extrabold leading-none text-[#C8F542] tabular-nums">
                {transitionSec}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. 底部操作层（暗角悬浮文字 + 右缘拇指调数标尺 + 视频重播/静音微控制 + 磨砂底坞） */}
      <div className={`relative z-20 px-4 ${bottomSafePad}`}>
        {phase === 'prepare' && (
          <button
            type="button"
            onClick={skipPreparation}
            className="w-full h-[54px] rounded-2xl bg-[#C8F542] text-[#111315] text-[16px] font-extrabold active:scale-[0.985] transition-transform"
          >
            我已就位，立即开练
          </button>
        )}

        {phase === 'active' && (
          <div>
            {/* 暗角悬浮动作信息（左侧） + 右缘竖向拇指次数标尺（含视频重播/静音快捷项） */}
            <div className="flex items-end justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1 pb-0.5">
                {currentExercise.isUnilateral && (
                  <div className="mb-2 inline-flex items-center p-0.5 rounded-xl bg-[#14171B]/75 backdrop-blur-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setCurrentSide('left')}
                      className={`min-h-[30px] px-3 rounded-[10px] text-[11.5px] font-semibold transition-colors whitespace-nowrap ${
                        currentSide === 'left'
                          ? 'bg-[#C8F542] text-[#111315]'
                          : 'text-white/75 hover:text-white'
                      }`}
                    >
                      左侧 {currentSide === 'right' ? '✓' : '进行中'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentSide('right')}
                      className={`min-h-[30px] px-3 rounded-[10px] text-[11.5px] font-semibold transition-colors whitespace-nowrap ${
                        currentSide === 'right'
                          ? 'bg-[#C8F542] text-[#111315]'
                          : 'text-white/75 hover:text-white'
                      }`}
                    >
                      右侧
                    </button>
                  </div>
                )}

                <div className="text-[12px] font-semibold text-[#C8F542] truncate">
                  {currentExercise.muscleGroup} · {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 节奏 {currentExercise.tempo}
                </div>
                <h1
                  className={`font-display-b mt-0.5 font-extrabold leading-tight text-white truncate ${
                    isSE ? 'text-[23px]' : 'text-[26px]'
                  }`}
                >
                  {currentExercise.name}
                </h1>
                <p className="mt-0.5 text-[12.5px] text-white/75 line-clamp-1">
                  {soundEnabled ? currentExercise.voiceCue : currentExercise.targetMuscle}
                </p>

                {/* 视频交互快捷控件（仅当接入了视频流时可用，占位态显示明确不可用提示） */}
                {hasRealVideo && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={replayCurrentVideo}
                      className="min-h-[32px] px-2.5 rounded-lg bg-white/10 hover:bg-white/16 backdrop-blur-md text-[11.5px] font-medium text-white flex items-center gap-1 whitespace-nowrap"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>重播视频</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMuted(!videoMuted)}
                      className="min-h-[32px] px-2.5 rounded-lg bg-white/10 hover:bg-white/16 backdrop-blur-md text-[11.5px] font-medium text-white flex items-center gap-1 whitespace-nowrap"
                    >
                      {videoMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      <span>{videoMuted ? '视频已静音' : '视频原声'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 右缘竖向拇指次数标尺 */}
              <div className="shrink-0 flex flex-col items-center rounded-[20px] bg-[#14171B]/72 backdrop-blur-2xl border border-white/12 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
                <button
                  type="button"
                  onClick={() => setRepDraft((r) => r + 1)}
                  className="h-10 w-10 rounded-[14px] bg-white/10 hover:bg-white/16 text-white font-mono-num text-[18px] font-bold flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="增加次数"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setRepDraft(currentExercise.targetReps)}
                  title="点击恢复目标次数"
                  className="py-1.5 px-1 text-center min-w-[42px]"
                >
                  <div
                    className={`font-display-b text-[26px] font-extrabold leading-none tabular-nums transition-colors ${
                      repsModified ? 'text-[#C8F542]' : 'text-white'
                    }`}
                  >
                    {repDraft}
                  </div>
                  <div className="text-[9.5px] font-mono-num text-white/55 mt-0.5 flex items-center justify-center gap-0.5">
                    {repsModified ? (
                      <>
                        <RotateCcw className="w-2.5 h-2.5 text-[#C8F542]" />
                        <span className="text-[#C8F542]">{currentExercise.targetReps}</span>
                      </>
                    ) : (
                      <span>{currentExercise.unit}</span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRepDraft((r) => Math.max(1, r - 1))}
                  className="h-10 w-10 rounded-[14px] bg-white/10 hover:bg-white/16 text-white font-mono-num text-[18px] font-bold flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="减少次数"
                >
                  −
                </button>
              </div>
            </div>

            {/* 系统化半透明磨砂控制坞 */}
            <div className="rounded-[24px] bg-[#14171B]/78 backdrop-blur-2xl border border-white/10 p-2 shadow-[0_18px_44px_rgba(0,0,0,0.55)]">
              <button
                type="button"
                onClick={handleCompleteActiveSet}
                className="w-full h-[52px] rounded-[16px] bg-[#C8F542] text-[#111315] text-[15.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.985] transition-transform"
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

              <div className="mt-1 grid grid-cols-3 items-center text-white/75">
                <button
                  type="button"
                  onClick={goToPrevExercise}
                  disabled={!prevExercisePreview}
                  className="min-h-[40px] px-2 rounded-[12px] flex items-center justify-center gap-1 text-[12px] font-medium disabled:opacity-30 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  <span>上一动作</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="min-h-[40px] px-2 rounded-[12px] flex items-center justify-center gap-1.5 text-[12px] font-medium hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? '继续' : '暂停'}</span>
                </button>
                <button
                  type="button"
                  onClick={skipCurrentExercise}
                  className="min-h-[40px] px-2 rounded-[12px] flex items-center justify-center gap-1 text-[12px] font-medium hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
                >
                  <span>跳过动作</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === 'setComplete' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-[24px] bg-[#14171B]/86 backdrop-blur-2xl border border-[#C8F542]/28 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
          >
            {latestLogged ? (
              <>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-[#C8F542]">
                      {restKind === 'round' ? `第 ${currentRound} 轮已完成` : '本组已实录'}
                      {autoAdvancePaused
                        ? ' · 已暂停自动进休息'
                        : ` · ${setCompleteAutoSec}s 后自动进休息`}
                    </div>
                    <div className="text-[17px] font-bold text-white font-mono-num mt-0.5 truncate">
                      {latestLogged.exerciseName} · {latestLogged.actualReps} {latestLogged.unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateLatestSetReps(-1)}
                      className="h-11 w-11 rounded-xl bg-white/10 hover:bg-white/16 text-white font-mono-num text-[18px] font-bold active:scale-95"
                      aria-label="减少实录次数"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLatestSetReps(1)}
                      className="h-11 w-11 rounded-xl bg-white/10 hover:bg-white/16 text-white font-mono-num text-[18px] font-bold active:scale-95"
                      aria-label="增加实录次数"
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
                      className={`h-11 rounded-xl text-[13px] font-semibold transition-colors ${
                        latestLogged.effort === lvl
                          ? 'bg-white text-[#111315]'
                          : 'bg-white/10 text-white/80 hover:bg-white/15'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goToRestNow}
                  className="w-full h-[52px] rounded-[16px] bg-[#C8F542] text-[#111315] text-[15px] font-extrabold active:scale-[0.985] transition-transform"
                >
                  立即进入休息（{restRemaining}s）
                </button>
              </>
            ) : (
              <div className="space-y-3 text-center">
                <div className="text-[12.5px] text-white/75 leading-relaxed">
                  尚未记录完成组（不展示虚构组数据），请先在动作进行中点击「完成本动作」
                </div>
                <button
                  type="button"
                  onClick={() => setPhase('active')}
                  className="w-full h-12 rounded-[16px] bg-[#C8F542] text-[#111315] text-[14px] font-extrabold"
                >
                  返回动作跟练
                </button>
              </div>
            )}
          </motion.div>
        )}

        {phase === 'rest' && (
          <div className="rounded-[24px] bg-[#14171B]/78 backdrop-blur-2xl border border-white/10 p-2 shadow-[0_18px_44px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustActiveRest(-15)}
                className="h-[52px] px-4 rounded-[16px] bg-white/10 hover:bg-white/15 text-[14px] font-mono-num font-bold text-white whitespace-nowrap active:scale-95 transition-transform"
              >
                -15s
              </button>
              <button
                type="button"
                onClick={() => adjustActiveRest(15)}
                className="h-[52px] px-4 rounded-[16px] bg-white/10 hover:bg-white/15 text-[14px] font-mono-num font-bold text-white whitespace-nowrap active:scale-95 transition-transform"
              >
                +15s
              </button>
              <button
                type="button"
                onClick={skipRestToNext}
                className="flex-1 h-[52px] rounded-[16px] bg-[#C8F542] text-[#111315] text-[15px] font-extrabold whitespace-nowrap active:scale-[0.985] transition-transform"
              >
                {restWaitingManual ? '开始下一动作' : '提前结束休息'}
              </button>
            </div>
          </div>
        )}

        {phase === 'nextTransition' && (
          <button
            type="button"
            onClick={startNextImmediately}
            className="w-full h-[54px] rounded-2xl bg-[#C8F542] text-[#111315] text-[16px] font-extrabold active:scale-[0.985] transition-transform"
          >
            立即开练（{currentExercise.targetReps} {currentExercise.unit}）
          </button>
        )}
      </div>

      {/* 暂停遮罩 */}
      {isPaused && (
        <div className="absolute inset-0 z-40 bg-[#08090B]/90 backdrop-blur-md flex flex-col items-center justify-center px-6 text-center">
          <div className="text-[13px] font-semibold text-[#C8F542]">
            主动暂停中 · 已暂停 {pausedSeconds}s
          </div>
          <h2 className="font-display-b mt-2 text-[28px] font-extrabold text-white text-balance">
            暂不记录完成，也不跳过动作
          </h2>
          <p className="mt-2 text-[13px] text-white/70">
            第 {currentRound}/{plan.rounds} 轮 · {currentExercise.name}
          </p>
          <div className="mt-7 w-full space-y-3">
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="w-full h-[54px] rounded-2xl bg-[#C8F542] text-[#111315] text-[16px] font-extrabold flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>继续跟练</span>
            </button>
            <button
              type="button"
              onClick={exitWorkoutEarly}
              className="w-full h-[48px] rounded-2xl bg-white/10 text-[14px] font-semibold text-white"
            >
              提前结束训练（已录 {loggedSets.length} 组）
            </button>
          </div>
        </div>
      )}

      {/* 退出确认抽屉 */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end">
          <div className={`rounded-t-3xl bg-[#16191D] p-5 ${bottomSafePad}`}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <h3 className="text-[17px] font-bold text-white">确认退出本次训练？</h3>
            <p className="mt-1.5 text-[13px] text-white/70 leading-relaxed">
              {loggedSets.length === 0
                ? '尚未记录任何完成组，退出将标记为「提前结束（完成 0 组）」。'
                : `已实录 ${loggedSets.length} 组，退出将保存实录但计为「提前结束（部分完成）」。`}
            </p>
            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full h-12 rounded-2xl bg-[#C8F542] text-[#111315] text-[15px] font-extrabold"
              >
                继续当前训练
              </button>
              <button
                type="button"
                onClick={exitWorkoutEarly}
                className="w-full h-12 rounded-2xl bg-white/10 text-white text-[14px] font-semibold"
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
