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
import { DeviceSize } from '../../types/design';
import { LiquidGlassA11yConfig } from '../liquid/LiquidGlassPrimitives';
import { SchemeBPrototype } from './SchemeBPrototype';

interface SchemeBLiquidGlassPrototypeProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  a11y: LiquidGlassA11yConfig;
}

/**
 * B1.5 Liquid Glass 实验版（聚焦「训练进行中」页面）
 * - 今日训练首页、完成一组、组间休息、下一动作、总结均严格回退为原版 B1.5 基线，不作强制玻璃化；
 * - 仅在「训练进行中」利用全屏运动视频/姿态背景，对 4 组特定悬浮控件探索 Liquid Glass：
 *   1. 顶部退出按钮
 *   2. 顶部音量控制
 *   3. 右侧次数调节器
 *   4. 底部非主操作控件（视频重播/静音、上一动作/暂停/跳过）
 * - 保留「完成本动作」高对比度实色按钮，与玻璃控件建立清晰的主次与空间Z轴层级。
 */
export const SchemeBLiquidGlassPrototype: React.FC<SchemeBLiquidGlassPrototypeProps> = ({
  sim,
  deviceSize,
  a11y,
}) => {
  const {
    phase,
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
    prevExercisePreview,
    totalExercisesInRound,
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
    handleCompleteActiveSet,
    goToPrevExercise,
    skipCurrentExercise,
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

  // 非「训练进行中」页面全部严格保持原版 B1.5 基线
  if (phase !== 'active') {
    return <SchemeBPrototype sim={sim} deviceSize={deviceSize} />;
  }

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[50px]';
  const bottomSafePad = isSE ? 'pb-4' : 'pb-7';

  const hasRealVideo = Boolean(activeVideoUrl) && !videoLoadFailed;
  const verifiedStaticPhoto = currentExercise.hasVerifiedPoseImage
    ? currentExercise.verticalImageUrl ?? currentExercise.imageUrl
    : undefined;
  const repsModified = repDraft !== currentExercise.targetReps;

  const a11yClasses = [
    a11y.reduceTransparency ? 'lg-a11y-reduce-transparency' : '',
    a11y.increaseContrast ? 'lg-a11y-increase-contrast' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`relative flex h-full flex-col overflow-hidden bg-[#08090B] text-white ${a11yClasses}`}>
      {/* 1. 全屏运动背景：保持 100% 锐利清晰，绝不做全屏模糊 */}
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
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : verifiedStaticPhoto ? (
        <img
          src={verifiedStaticPhoto}
          alt={currentExercise.name}
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0C0F14] px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#9A9D9E] mb-4">
            <Film className="w-7 h-7" />
          </div>
          <div className="text-[14px] font-bold text-white">暂无该动作实拍视频或参考图</div>
          <div className="mt-1.5 text-[12px] text-white/60 leading-relaxed max-w-[240px]">
            请依据下方动作要领与目标肌群自行掌握动作幅度与节奏
          </div>
        </div>
      )}

      {/* 极轻薄保护渐变：尽量留出通透舞台背景，让玻璃控件真正有背景光影可以采样透出 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/58 via-black/20 to-transparent" />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/72 via-black/28 to-transparent ${
          isSE ? 'h-[32%]' : 'h-[28%]'
        }`}
      />

      {/* 2. 顶部区域：仅「退出」与「音量」采用轻盈 Liquid Glass 悬浮控件 */}
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
                  done ? 'bg-[#C8F542]' : curr ? 'bg-white' : 'bg-white/22'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* 改造控件 1：顶部退出按钮（Liquid Glass 悬浮胶囊） */}
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="lg-optical-pill lg-optical-interactive min-h-[38px] pl-2.5 pr-3.5 rounded-full text-[12px] font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] flex items-center gap-0.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-white/90" />
            <span>退出</span>
          </button>

          {/* 中央文字保持纯净无框，保证运动中快速瞄读清晰度 */}
          <div className="font-mono-num text-[12px] font-semibold text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)] whitespace-nowrap truncate">
            <span>第 {currentRound}/{plan.rounds} 轮</span>
            <span className="mx-1.5 text-white/45" aria-hidden="true">·</span>
            <span>动作 {exerciseIdx + 1}/{totalExercisesInRound}</span>
            <span className="mx-1.5 text-white/45" aria-hidden="true">·</span>
            <span className="text-[#C8F542]">{formatTimeMMSS(elapsedSeconds)}</span>
          </div>

          {/* 改造控件 2：顶部音量控制（Liquid Glass 悬浮圆钮，去实心绿底） */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`lg-optical-pill lg-optical-interactive min-h-[38px] min-w-[38px] rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
              soundEnabled ? 'text-white' : 'text-white/45'
            }`}
            aria-label="语音与提示音开关"
            title={soundEnabled ? '语音提示：开' : '语音提示：关'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>

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
      </div>

      {/* 中间完全留白给人物姿态与动作幅度 */}
      <div className="flex-1" />

      {/* 3. 下半区：动作文字 + 右侧 Liquid Glass 次数胶囊 + 空间分离的实色主按钮与玻璃次级栏 */}
      <div className={`relative z-20 px-4 ${bottomSafePad}`}>
        <div className="flex items-end justify-between gap-3 mb-3.5">
          <div className="min-w-0 flex-1 pb-0.5">
            {currentExercise.isUnilateral && (
              <div className="mb-2 inline-flex items-center p-0.5 rounded-xl bg-[#14171B]/75 backdrop-blur-md border border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrentSide('left')}
                  className={`min-h-[30px] px-3 rounded-[10px] text-[11.5px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
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
                  className={`min-h-[30px] px-3 rounded-[10px] text-[11.5px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    currentSide === 'right'
                      ? 'bg-[#C8F542] text-[#111315]'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  右侧
                </button>
              </div>
            )}

            <div className="text-[12px] font-semibold text-[#C8F542] truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              {currentExercise.muscleGroup} · {getExerciseWeightLabel(currentExercise.usesDumbbells)} · 节奏{' '}
              {currentExercise.tempo}
            </div>
            <h1
              className={`font-display-b mt-0.5 font-extrabold leading-tight text-white truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] ${
                isSE ? 'text-[23px]' : 'text-[26px]'
              }`}
            >
              {currentExercise.name}
            </h1>
            <p className="mt-0.5 text-[12.5px] text-white/82 line-clamp-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
              {soundEnabled ? currentExercise.voiceCue : currentExercise.targetMuscle}
            </p>

            {/* 改造控件 4（视频非主控件）：重播 / 静音采用轻盈玻璃小胶囊 */}
            {hasRealVideo && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={replayCurrentVideo}
                  className="lg-optical-pill lg-optical-interactive min-h-[32px] px-3 rounded-full text-[11.5px] font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重播视频</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMuted(!videoMuted)}
                  className="lg-optical-pill lg-optical-interactive min-h-[32px] px-3 rounded-full text-[11.5px] font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  {videoMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  <span>{videoMuted ? '视频已静音' : '视频原声'}</span>
                </button>
              </div>
            )}
          </div>

          {/* 改造控件 3：右侧一体式 Liquid Glass 次数调节胶囊（无大黑底边框，内收微细分割线） */}
          <div className="lg-optical-pill shrink-0 flex flex-col items-center rounded-full p-1">
            <button
              type="button"
              onClick={() => setRepDraft((r) => r + 1)}
              className="h-10 w-11 rounded-full hover:bg-white/10 active:scale-90 text-white font-mono-num text-[18px] font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] flex items-center justify-center transition-all cursor-pointer"
              aria-label="增加次数"
            >
              +
            </button>

            <div className="w-6 h-[1px] bg-white/14" />

            <button
              type="button"
              onClick={() => setRepDraft(currentExercise.targetReps)}
              title="点击恢复目标次数"
              className="py-1.5 px-1 text-center min-w-[44px] cursor-pointer"
            >
              <motion.div
                key={repDraft}
                initial={a11y.reduceMotion ? false : { scale: 1.12, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: a11y.reduceMotion ? 0.01 : 0.14 }}
                className={`font-display-b text-[26px] font-extrabold leading-none tabular-nums [text-shadow:0_1px_6px_rgba(0,0,0,0.5)] transition-colors ${
                  repsModified ? 'text-[#C8F542]' : 'text-white'
                }`}
              >
                {repDraft}
              </motion.div>
              <div className="text-[9.5px] font-mono-num text-white/65 mt-0.5 flex items-center justify-center gap-0.5">
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

            <div className="w-6 h-[1px] bg-white/14" />

            <button
              type="button"
              onClick={() => setRepDraft((r) => Math.max(1, r - 1))}
              className="h-10 w-11 rounded-full hover:bg-white/10 active:scale-90 text-white font-mono-num text-[18px] font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] flex items-center justify-center transition-all cursor-pointer"
              aria-label="减少次数"
            >
              −
            </button>
          </div>
        </div>

        {/* 空间分离设计：不再把主按钮和次级按钮塞进一个大黑盒里 */}
        <div className="space-y-2">
          {/* 主完成按钮：保留纯净高对比度实色设计（无塑料渐变、无白边伪装） */}
          <button
            type="button"
            onClick={handleCompleteActiveSet}
            className="w-full h-[54px] rounded-full bg-[#C8F542] text-[#111315] text-[15.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.985] transition-transform cursor-pointer shadow-[0_8px_24px_-6px_rgba(0,0,0,0.45)]"
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

          {/* 改造控件 4：底部非主操作控件（独立悬浮 Liquid Glass 长条，中间空隙直接透出视频背景） */}
          <div className="lg-optical-pill rounded-full p-1 grid grid-cols-3 items-center text-white/90">
            <button
              type="button"
              onClick={goToPrevExercise}
              disabled={!prevExercisePreview}
              className="min-h-[40px] px-2 rounded-full flex items-center justify-center gap-1 text-[12px] font-medium [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] disabled:opacity-30 hover:bg-white/10 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span>上一动作</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="min-h-[40px] px-2 rounded-full flex items-center justify-center gap-1.5 text-[12px] font-medium [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] hover:bg-white/10 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? '继续' : '暂停'}</span>
            </button>
            <button
              type="button"
              onClick={skipCurrentExercise}
              className="min-h-[40px] px-2 rounded-full flex items-center justify-center gap-1 text-[12px] font-medium [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] hover:bg-white/10 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
            >
              <span>跳过动作</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 暂停遮罩（保持与原版一致） */}
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
              className="w-full h-[54px] rounded-2xl bg-[#C8F542] text-[#111315] text-[16px] font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>继续跟练</span>
            </button>
            <button
              type="button"
              onClick={exitWorkoutEarly}
              className="w-full h-[48px] rounded-2xl bg-white/10 text-[14px] font-semibold text-white cursor-pointer"
            >
              提前结束训练（已录 {loggedSets.length} 组）
            </button>
          </div>
        </div>
      )}

      {/* 退出确认抽屉（保持与原版一致） */}
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
                className="w-full h-12 rounded-2xl bg-[#C8F542] text-[#111315] text-[15px] font-extrabold cursor-pointer"
              >
                继续当前训练
              </button>
              <button
                type="button"
                onClick={exitWorkoutEarly}
                className="w-full h-12 rounded-2xl bg-white/10 text-white text-[14px] font-semibold cursor-pointer"
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
