import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { ExerciseItem, WorkoutPlan } from '../../types/design';
import { formatTempoExplanation } from '../cinematic-polished/polishedMedia';
import { GlassButton, GlassDock, GlassIconButton, GlassPanel } from './WarmGlass';
import { getWarmExerciseMedia, WARM_TOKENS } from './warmTokens';

interface WarmExerciseDetailViewProps {
  plan: WorkoutPlan;
  exerciseIndex: number;
  reduceMotion?: boolean;
  deviceSize: 'se' | 'standard' | 'promax';
  getExerciseWeightLabel: (usesDumbbells: boolean) => string;
  onChangeIndex: (nextIndex: number) => void;
  onClose: () => void;
  onStartWorkout: () => void;
}

export const WarmExerciseDetailView: React.FC<WarmExerciseDetailViewProps> = ({
  plan,
  exerciseIndex,
  reduceMotion = false,
  deviceSize,
  getExerciseWeightLabel,
  onChangeIndex,
  onClose,
  onStartWorkout,
}) => {
  const exercise: ExerciseItem = plan.exercises[exerciseIndex] ?? plan.exercises[0];
  const asset = getWarmExerciseMedia(exercise);
  const total = plan.exercises.length;
  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[50px]';
  const stageHeightClass = isSE ? 'h-[48%]' : 'h-[54%]';

  const tempoParts = /^\d+-\d+-\d+$/.test(exercise.tempo)
    ? exercise.tempo.split('-')
    : null;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0.45 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-40 flex flex-col overflow-hidden"
      style={{ backgroundColor: WARM_TOKENS.canvasBg, color: WARM_TOKENS.inkPrimary }}
    >
      {/* 上半部：连续共享舞台媒体，完整展现人体与哑铃器械 */}
      <motion.div
        layoutId={reduceMotion ? undefined : 'warm-perf-stage-media'}
        transition={{ duration: reduceMotion ? 0.01 : 0.38, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full ${stageHeightClass} shrink-0 overflow-hidden`}
        style={{ backgroundColor: WARM_TOKENS.surfaceBackdropStudio }}
      >
        <AnimatePresence mode="sync">
          <motion.img
            key={exercise.id}
            src={asset.playerVertUrl}
            alt={exercise.name}
            referrerPolicy="no-referrer"
            initial={reduceMotion ? false : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute inset-0 h-full w-full ${
              asset.detailContain
                ? 'object-contain pb-6'
                : `object-cover ${asset.focalClass ?? 'object-center'}`
            } ${WARM_TOKENS.photoFilterClass}`}
          />
        </AnimatePresence>

        <div
          className={`pointer-events-none absolute inset-0 ${WARM_TOKENS.photoCoolAirTintClass}`}
        />

        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: WARM_TOKENS.detailHeaderOverlay }}
        />

        {/* 顶部轻量悬浮导航与序号 */}
        <div className={`relative z-10 ${topSafePad} px-4 flex items-center justify-between gap-3`}>
          <GlassButton
            onClick={onClose}
            className="min-h-[40px] pl-2.5 pr-3.5 text-[12.5px] font-medium gap-0.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>今日</span>
          </GlassButton>

          <GlassPanel
            variant="control"
            className="h-[34px] px-3 rounded-full flex items-center font-mono-num text-[12px] font-semibold"
            style={{
              color: WARM_TOKENS.inkPrimary,
            }}
          >
            动作 {String(exerciseIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </GlassPanel>

          <div className="flex items-center gap-1.5">
            <GlassIconButton
              disabled={exerciseIndex === 0}
              onClick={() => onChangeIndex(Math.max(0, exerciseIndex - 1))}
              aria-label="上一个动作"
              className="h-10 w-10 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </GlassIconButton>
            <GlassIconButton
              disabled={exerciseIndex >= total - 1}
              onClick={() => onChangeIndex(Math.min(total - 1, exerciseIndex + 1))}
              aria-label="下一个动作"
              className="h-10 w-10 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </GlassIconButton>
          </div>
        </div>

        {/* 影像底部自然落位标题 */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`warm-detail-head-${exercise.id}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="text-[12px] font-semibold tracking-[0.02em]"
                style={{ color: WARM_TOKENS.accentTextOnLight }}
              >
                {plan.category} · {exercise.muscleGroup}
                {exercise.isUnilateral ? ' · 单侧交替' : ''}
              </div>
              <h1
                className={`mt-1 font-editorial-serif font-semibold tracking-[-0.03em] leading-[1.14] ${
                  isSE ? 'text-[26px]' : 'text-[30px]'
                }`}
                style={{ color: WARM_TOKENS.inkPrimary }}
              >
                {exercise.name}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 下半部：清透精密数据与发力拆解 */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.26, delay: reduceMotion ? 0 : 0.04 }}
        className="relative flex-1 flex flex-col min-h-0"
        style={{ backgroundColor: WARM_TOKENS.canvasBg }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-44"
          style={{
            background:
              'radial-gradient(110% 80% at 85% 18%, rgba(194, 65, 12, 0.06) 0%, rgba(232, 224, 210, 0.22) 48%, rgba(244, 241, 235, 0) 100%)',
          }}
        />
        <div
          className={`iphone-scroll relative z-10 flex-1 overflow-y-auto px-5 pt-3 ${
            isSE ? 'pb-24' : 'pb-28'
          }`}
        >
          <div
            className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pb-4 text-[12.5px]"
            style={{ borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}` }}
          >
            <span
              className="font-mono-num font-semibold"
              style={{ color: WARM_TOKENS.inkPrimary }}
            >
              目标 {exercise.targetReps} {exercise.unit}
            </span>
            <span aria-hidden="true" className="opacity-30">
              ·
            </span>
            <span
              className="font-mono-num font-medium"
              style={{ color: WARM_TOKENS.accentTextOnLight }}
            >
              {getExerciseWeightLabel(exercise.usesDumbbells)}
            </span>
            <span aria-hidden="true" className="opacity-30">
              ·
            </span>
            <span className="font-mono-num" style={{ color: WARM_TOKENS.auxSlate }}>
              节奏 {exercise.tempo}
            </span>
          </div>

          <div
            className="py-4"
            style={{ borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}` }}
          >
            <div className="text-[12px] mb-2" style={{ color: WARM_TOKENS.inkMuted }}>
              发力与节奏要求
            </div>
            {tempoParts ? (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: '离心下放', sec: `${tempoParts[0]}s` },
                  { label: '底部停顿', sec: `${tempoParts[1]}s` },
                  { label: '发力推拉', sec: `${tempoParts[2]}s` },
                ].map((phase) => (
                  <GlassPanel
                    key={phase.label}
                    variant="chip"
                    className="rounded-xl px-3 py-2.5"
                  >
                    <div
                      className="font-display-b text-[20px] font-semibold leading-none tabular-nums"
                      style={{ color: WARM_TOKENS.inkPrimary }}
                    >
                      {phase.sec}
                    </div>
                    <div
                      className="mt-1 text-[11.5px]"
                      style={{ color: WARM_TOKENS.inkSecondary }}
                    >
                      {phase.label}
                    </div>
                  </GlassPanel>
                ))}
              </div>
            ) : (
              <div
                className="text-[13.5px] font-medium mb-1.5"
                style={{ color: WARM_TOKENS.inkPrimary }}
              >
                {formatTempoExplanation(exercise.tempo)}
              </div>
            )}
            <p className="text-[13px] leading-[1.6]" style={{ color: WARM_TOKENS.inkSecondary }}>
              {exercise.voiceCue}
            </p>
          </div>

          <div className="py-4 space-y-3 text-[13px] leading-[1.55]">
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0" style={{ color: WARM_TOKENS.inkMuted }}>
                重点部位
              </span>
              <span className="text-right font-medium" style={{ color: WARM_TOKENS.inkPrimary }}>
                {exercise.targetMuscle}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0" style={{ color: WARM_TOKENS.inkMuted }}>
                就位提示
              </span>
              <span className="text-right" style={{ color: WARM_TOKENS.inkSecondary }}>
                {exercise.nextPrepCue}
              </span>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none shrink-0 relative px-4 pt-3"
          style={{
            paddingBottom: `calc(${isSE ? '12px' : '20px'} + env(safe-area-inset-bottom, 0px))`,
            background:
              'linear-gradient(180deg, rgba(244,241,235,0) 0%, rgba(244,241,235,0.2) 100%)',
          }}
        >
          <GlassDock className="pointer-events-auto">
            <button
              type="button"
              onClick={onStartWorkout}
              className="w-full h-[46px] rounded-full text-[14.5px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
              style={{
                backgroundColor: WARM_TOKENS.accent,
                color: WARM_TOKENS.accentContrastText,
                boxShadow:
                  '0 10px 22px -12px rgba(194, 65, 12, 0.7)',
              }}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>进入全屏跟练</span>
            </button>
          </GlassDock>
        </div>
      </motion.div>
    </motion.div>
  );
};
