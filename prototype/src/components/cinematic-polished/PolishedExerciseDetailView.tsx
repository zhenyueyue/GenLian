import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { ExerciseItem, WorkoutPlan } from '../../types/design';
import { formatTempoExplanation, getPolishedExerciseMedia } from './polishedMedia';

interface PolishedExerciseDetailViewProps {
  plan: WorkoutPlan;
  exerciseIndex: number;
  reduceMotion?: boolean;
  deviceSize: 'se' | 'standard' | 'promax';
  getExerciseWeightLabel: (usesDumbbells: boolean) => string;
  onChangeIndex: (nextIndex: number) => void;
  onClose: () => void;
  onStartWorkout: () => void;
}

/**
 * 连续全屏动作详情页（取代传统底部圆角弹窗）：
 * - 顶部 54% 无边框全幅铺满 9:16 居家动作实景，与「全屏跟练舞台」共享 layoutId 影像延展通道
 * - 自然渐变衔接下方编辑式训练指引（目标肌群、节奏拆解、发力要点与准备姿态）
 * - 支持左右切换同课程动作，一键将当前影像无缝扩展进入全屏跟练
 */
export const PolishedExerciseDetailView: React.FC<PolishedExerciseDetailViewProps> = ({
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
  const asset = getPolishedExerciseMedia(exercise);
  const total = plan.exercises.length;
  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[50px]';
  const bottomSafePad = isSE ? 'pb-4' : 'pb-7';
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
      className="absolute inset-0 z-40 flex flex-col bg-[#11100F] text-[#F2EDE4] overflow-hidden"
    >
      {/* 上半部：全幅无边动作实景（与全屏播放器共享 layoutId 扩展过渡） */}
      <motion.div
        layoutId={reduceMotion ? undefined : 'cinematic-stage-media'}
        transition={{ duration: reduceMotion ? 0.01 : 0.38, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full ${stageHeightClass} shrink-0 overflow-hidden bg-[#1A1816]`}
      >
        <AnimatePresence mode="sync">
          <motion.img
            key={exercise.id}
            src={asset.playerVertUrl}
            alt={exercise.name}
            referrerPolicy="no-referrer"
            initial={reduceMotion ? false : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </AnimatePresence>

        {/* 柔和上下自然溶入（无弹窗硬边） */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(17,16,15,0.52) 0%, rgba(17,16,15,0) 26%, rgba(17,16,15,0) 60%, rgba(17,16,15,0.82) 88%, #11100F 100%)',
          }}
        />

        {/* 顶部悬浮导航与动作序列指示 */}
        <div
          className={`relative z-10 ${topSafePad} px-4 flex items-center justify-between gap-3`}
        >
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] pl-2.5 pr-3.5 rounded-full bg-[#1A1816]/48 backdrop-blur-xl border border-[#F2EDE4]/16 text-[12.5px] font-medium text-[#F2EDE4] flex items-center gap-0.5 cursor-pointer hover:bg-[#1A1816]/72 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>今日</span>
          </button>

          <div className="font-mono-num text-[12px] font-medium text-[#F2EDE4] [text-shadow:0_1px_6px_rgba(0,0,0,0.85)]">
            动作 0{exerciseIndex + 1} / 0{total}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={exerciseIndex === 0}
              onClick={() => onChangeIndex(Math.max(0, exerciseIndex - 1))}
              aria-label="上一个动作"
              className="h-10 w-10 rounded-full bg-[#1A1816]/48 backdrop-blur-xl border border-[#F2EDE4]/16 flex items-center justify-center text-[#F2EDE4] disabled:opacity-30 cursor-pointer hover:bg-[#1A1816]/72 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={exerciseIndex >= total - 1}
              onClick={() => onChangeIndex(Math.min(total - 1, exerciseIndex + 1))}
              aria-label="下一个动作"
              className="h-10 w-10 rounded-full bg-[#1A1816]/48 backdrop-blur-xl border border-[#F2EDE4]/16 flex items-center justify-center text-[#F2EDE4] disabled:opacity-30 cursor-pointer hover:bg-[#1A1816]/72 active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 影像底部自然落位标题（紧贴地平线留白，不压人体主体） */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`detail-head-${exercise.id}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-[12px] font-medium text-[#D9BE94] tracking-[0.02em]">
                {plan.category} · {exercise.muscleGroup}
                {exercise.isUnilateral ? ' · 单侧交替' : ''}
              </div>
              <h1
                className={`mt-1 font-semibold tracking-[-0.015em] text-[#F2EDE4] leading-[1.18] ${
                  isSE ? 'text-[23px]' : 'text-[26px]'
                }`}
              >
                {exercise.name}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 下半部：连续编辑式动作拆解与训练操作 */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.26, delay: reduceMotion ? 0 : 0.04 }}
        className="flex-1 flex flex-col min-h-0 bg-[#11100F]"
      >
        <div className={`iphone-scroll flex-1 overflow-y-auto px-5 pt-2 ${isSE ? 'pb-24' : 'pb-28'}`}>
          {/* 一行克制规格带 */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pb-4 border-b border-[#F2EDE4]/10 text-[12.5px]">
            <span className="font-mono-num font-semibold text-[#F2EDE4]">
              目标 {exercise.targetReps} {exercise.unit}
            </span>
            <span aria-hidden="true" className="text-[#F2EDE4]/25">·</span>
            <span className="font-mono-num text-[#D9BE94]">
              {getExerciseWeightLabel(exercise.usesDumbbells)}
            </span>
            <span aria-hidden="true" className="text-[#F2EDE4]/25">·</span>
            <span className="font-mono-num text-[#B8AFA4]">节奏 {exercise.tempo}</span>
          </div>

          {/* 动作节拍拆解条 */}
          <div className="py-4 border-b border-[#F2EDE4]/8">
            <div className="text-[12px] text-[#948B80] mb-2">发力与节奏要求</div>
            {tempoParts ? (
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {[
                  { label: '离心下放', sec: `${tempoParts[0]}s` },
                  { label: '底部停顿', sec: `${tempoParts[1]}s` },
                  { label: '发力推拉', sec: `${tempoParts[2]}s` },
                ].map((phase) => (
                  <div
                    key={phase.label}
                    className="rounded-xl bg-[#191715] px-3 py-2.5 border border-[#F2EDE4]/6"
                  >
                    <div className="font-display-b text-[20px] font-semibold text-[#F2EDE4] leading-none tabular-nums">
                      {phase.sec}
                    </div>
                    <div className="mt-1 text-[11.5px] text-[#B8AFA4]">{phase.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13.5px] font-medium text-[#F2EDE4] mb-1.5">
                {formatTempoExplanation(exercise.tempo)}
              </div>
            )}
            <p className="text-[13px] text-[#D8D0C5] leading-[1.6]">{exercise.voiceCue}</p>
          </div>

          {/* 肌群与就位提示 */}
          <div className="py-4 space-y-3 text-[13px] leading-[1.55]">
            <div className="flex items-start justify-between gap-4">
              <span className="text-[#948B80] shrink-0">重点部位</span>
              <span className="text-[#F2EDE4] text-right">{exercise.targetMuscle}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-[#948B80] shrink-0">就位提示</span>
              <span className="text-[#C7BFB4] text-right">{exercise.nextPrepCue}</span>
            </div>
          </div>
        </div>

        {/* 底部操作区：点击直接将上方影像扩展进入全屏跟练 */}
        <div
          className={`shrink-0 bg-gradient-to-t from-[#11100F] via-[#11100F]/96 to-transparent px-5 pt-3 ${bottomSafePad}`}
        >
          <button
            type="button"
            onClick={onStartWorkout}
            className="w-full h-[52px] rounded-full bg-[#F2EDE4] text-[#11100F] text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-white active:scale-[0.985] transition-all cursor-pointer shadow-[0_10px_28px_-6px_rgba(0,0,0,0.55)]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>进入全屏跟练</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
