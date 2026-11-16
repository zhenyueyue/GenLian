import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { ExerciseItem, WorkoutPlan } from '../../types/design';
import { formatTempoExplanation } from '../cinematic-polished/polishedMedia';
import { getMoodExerciseMedia, MoodThemeConfig } from './moodThemes';

interface MoodExerciseDetailViewProps {
  theme: MoodThemeConfig;
  plan: WorkoutPlan;
  exerciseIndex: number;
  reduceMotion?: boolean;
  deviceSize: 'se' | 'standard' | 'promax';
  getExerciseWeightLabel: (usesDumbbells: boolean) => string;
  onChangeIndex: (nextIndex: number) => void;
  onClose: () => void;
  onStartWorkout: () => void;
}

export const MoodExerciseDetailView: React.FC<MoodExerciseDetailViewProps> = ({
  theme,
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
  const asset = getMoodExerciseMedia(theme, exercise);
  const total = plan.exercises.length;
  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[50px]';
  const bottomSafePad = isSE ? 'pb-4' : 'pb-7';
  const stageHeightClass = isSE ? 'h-[48%]' : 'h-[54%]';

  const tempoParts = /^\d+-\d+-\d+$/.test(exercise.tempo)
    ? exercise.tempo.split('-')
    : null;

  const isDynamic = theme.id === 'dynamic';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0.45 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-40 flex flex-col overflow-hidden"
      style={{ backgroundColor: theme.canvasBg, color: theme.textPrimary }}
    >
      {/* 上半部：全幅无边动作实景 */}
      <motion.div
        layoutId={reduceMotion ? undefined : `mood-${theme.id}-stage-media`}
        transition={{ duration: reduceMotion ? 0.01 : 0.38, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full ${stageHeightClass} shrink-0 overflow-hidden`}
        style={{ backgroundColor: theme.surfaceBg }}
      >
        <AnimatePresence mode="sync">
          <motion.img
            key={`${theme.id}-${exercise.id}`}
            src={asset.playerVertUrl}
            alt={exercise.name}
            referrerPolicy="no-referrer"
            initial={reduceMotion ? false : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute inset-0 h-full w-full object-cover object-center ${theme.photoToneFilterClass}`}
          />
        </AnimatePresence>

        <div className={`pointer-events-none absolute inset-0 ${theme.photoToneTintClass}`} />

        {/* 柔和上下自然溶入 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: isDynamic
              ? 'linear-gradient(180deg, rgba(38,42,49,0.50) 0%, rgba(38,42,49,0) 26%, rgba(38,42,49,0) 58%, rgba(242,244,247,0.82) 88%, #F2F4F7 100%)'
              : theme.id === 'daylight'
              ? 'linear-gradient(180deg, rgba(250,247,242,0.58) 0%, rgba(250,247,242,0) 26%, rgba(250,247,242,0) 58%, rgba(250,247,242,0.82) 88%, #FAF7F2 100%)'
              : 'linear-gradient(180deg, rgba(245,248,251,0.58) 0%, rgba(245,248,251,0) 26%, rgba(245,248,251,0) 58%, rgba(245,248,251,0.82) 88%, #F5F8FB 100%)',
          }}
        />

        {/* 顶部悬浮导航与动作序列指示 */}
        <div className={`relative z-10 ${topSafePad} px-4 flex items-center justify-between gap-3`}>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] pl-2.5 pr-3.5 rounded-full backdrop-blur-xl text-[12.5px] font-medium flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all"
            style={{
              backgroundColor: theme.playerGlassBg,
              border: `1px solid ${theme.playerGlassBorder}`,
              color: theme.playerGlassText,
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>今日</span>
          </button>

          <div
            className="font-mono-num text-[12px] font-semibold"
            style={{
              color: isDynamic ? '#FFFFFF' : theme.textPrimary,
              textShadow: isDynamic ? '0 1px 6px rgba(0,0,0,0.65)' : undefined,
            }}
          >
            动作 0{exerciseIndex + 1} / 0{total}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={exerciseIndex === 0}
              onClick={() => onChangeIndex(Math.max(0, exerciseIndex - 1))}
              aria-label="上一个动作"
              className="h-10 w-10 rounded-full backdrop-blur-xl flex items-center justify-center disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
              style={{
                backgroundColor: theme.playerGlassBg,
                border: `1px solid ${theme.playerGlassBorder}`,
                color: theme.playerGlassText,
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={exerciseIndex >= total - 1}
              onClick={() => onChangeIndex(Math.min(total - 1, exerciseIndex + 1))}
              aria-label="下一个动作"
              className="h-10 w-10 rounded-full backdrop-blur-xl flex items-center justify-center disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
              style={{
                backgroundColor: theme.playerGlassBg,
                border: `1px solid ${theme.playerGlassBorder}`,
                color: theme.playerGlassText,
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 影像底部自然落位标题 */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`detail-head-${exercise.id}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="text-[12px] font-semibold tracking-[0.02em]"
                style={{ color: theme.accent }}
              >
                {plan.category} · {exercise.muscleGroup}
                {exercise.isUnilateral ? ' · 单侧交替' : ''}
              </div>
              <h1
                className={`mt-1 font-semibold tracking-[-0.015em] leading-[1.18] ${
                  isSE ? 'text-[23px]' : 'text-[26px]'
                }`}
                style={{ color: theme.textPrimary }}
              >
                {exercise.name}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 下半部：连续编辑式动作拆解 */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.26, delay: reduceMotion ? 0 : 0.04 }}
        className="flex-1 flex flex-col min-h-0"
        style={{ backgroundColor: theme.canvasBg }}
      >
        <div className={`iphone-scroll flex-1 overflow-y-auto px-5 pt-2 ${isSE ? 'pb-24' : 'pb-28'}`}>
          <div
            className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pb-4 text-[12.5px]"
            style={{ borderBottom: `1px solid ${theme.hairlineBorder}` }}
          >
            <span className="font-mono-num font-semibold" style={{ color: theme.textPrimary }}>
              目标 {exercise.targetReps} {exercise.unit}
            </span>
            <span aria-hidden="true" className="opacity-30">
              ·
            </span>
            <span className="font-mono-num font-medium" style={{ color: theme.accent }}>
              {getExerciseWeightLabel(exercise.usesDumbbells)}
            </span>
            <span aria-hidden="true" className="opacity-30">
              ·
            </span>
            <span className="font-mono-num" style={{ color: theme.textSecondary }}>
              节奏 {exercise.tempo}
            </span>
          </div>

          <div
            className="py-4"
            style={{ borderBottom: `1px solid ${theme.hairlineBorder}` }}
          >
            <div className="text-[12px] mb-2" style={{ color: theme.textMuted }}>
              发力与节奏要求
            </div>
            {tempoParts ? (
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {[
                  { label: '离心下放', sec: `${tempoParts[0]}s` },
                  { label: '底部停顿', sec: `${tempoParts[1]}s` },
                  { label: '发力推拉', sec: `${tempoParts[2]}s` },
                ].map((phase) => (
                  <div
                    key={phase.label}
                    className="rounded-xl px-3 py-2.5"
                    style={{
                      backgroundColor: theme.surfaceBg,
                      border: `1px solid ${theme.hairlineBorder}`,
                    }}
                  >
                    <div
                      className="font-display-b text-[20px] font-semibold leading-none tabular-nums"
                      style={{ color: theme.textPrimary }}
                    >
                      {phase.sec}
                    </div>
                    <div className="mt-1 text-[11.5px]" style={{ color: theme.textSecondary }}>
                      {phase.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="text-[13.5px] font-medium mb-1.5"
                style={{ color: theme.textPrimary }}
              >
                {formatTempoExplanation(exercise.tempo)}
              </div>
            )}
            <p className="text-[13px] leading-[1.6]" style={{ color: theme.textSecondary }}>
              {exercise.voiceCue}
            </p>
          </div>

          <div className="py-4 space-y-3 text-[13px] leading-[1.55]">
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0" style={{ color: theme.textMuted }}>
                重点部位
              </span>
              <span className="text-right font-medium" style={{ color: theme.textPrimary }}>
                {exercise.targetMuscle}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0" style={{ color: theme.textMuted }}>
                就位提示
              </span>
              <span className="text-right" style={{ color: theme.textSecondary }}>
                {exercise.nextPrepCue}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`shrink-0 px-5 pt-3 ${bottomSafePad}`}
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${theme.canvasBg} 38%, ${theme.canvasBg} 100%)`,
          }}
        >
          <button
            type="button"
            onClick={onStartWorkout}
            className="w-full h-[52px] rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all cursor-pointer shadow-[0_8px_22px_-6px_rgba(0,0,0,0.22)]"
            style={{
              backgroundColor: theme.primaryCtaBg,
              color: theme.primaryCtaText,
            }}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>进入全屏跟练</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
