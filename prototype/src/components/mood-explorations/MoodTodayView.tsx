import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Play,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { USER_CONTEXT, WORKOUT_OPTIONS } from '../../data/workouts';
import { useWorkoutSimulator } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';
import { getMoodExerciseMedia, MoodThemeConfig } from './moodThemes';

interface MoodTodayViewProps {
  theme: MoodThemeConfig;
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
  onInspectExerciseIdx: (idx: number) => void;
  onStartWorkout: () => void;
}

const REST_PRESETS = [30, 60, 90, 120];

function splitTitleParts(rawTitle: string): { mainTitle: string; scopeTag: string | null } {
  const match = rawTitle.match(/^(.+?)（(.+?)）$/);
  if (match) {
    return { mainTitle: match[1], scopeTag: match[2] };
  }
  return { mainTitle: rawTitle, scopeTag: null };
}

export const MoodTodayView: React.FC<MoodTodayViewProps> = ({
  theme,
  sim,
  deviceSize,
  reduceMotion = false,
  onInspectExerciseIdx,
  onStartWorkout,
}) => {
  const {
    plan,
    planIndex,
    selectPlan,
    activePlate,
    PLATE_PRESETS,
    selectPlatePreset,
    customRestSeconds,
    setCustomRestSeconds,
    customRoundRestSeconds,
    setCustomRoundRestSeconds,
    restAutoAdvance,
    setRestAutoAdvance,
    postponedNote,
    setPostponedNote,
    getExerciseWeightLabel,
  } = sim;

  const [scrollY, setScrollY] = useState(0);
  const [showSetupSheet, setShowSetupSheet] = useState(false);

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[32px]' : 'pt-[50px]';
  const bottomScrollPad = isSE ? 'pb-32' : 'pb-36';
  const heroHeightClass = isSE ? 'h-[430px]' : deviceSize === 'standard' ? 'h-[505px]' : 'h-[545px]';

  const media = theme.planMedia[plan.id] ?? theme.planMedia['strength-a'];
  const { mainTitle, scopeTag } = splitTitleParts(plan.title);

  const headerDocked = scrollY > 185;
  const heroParallaxY = reduceMotion ? 0 : Math.min(scrollY * 0.28, 100);
  const heroScale = reduceMotion ? 1 : 1 + Math.min(scrollY * 0.0004, 0.08);
  const heroImageOpacity = reduceMotion ? 1 : Math.max(0.32, 1 - scrollY / 380);
  const heroCopyOpacity = reduceMotion ? 1 : Math.max(0, 1 - scrollY / 165);
  const heroCopyY = reduceMotion ? 0 : -Math.min(scrollY * 0.14, 24);

  const leadExercise = plan.exercises[0];
  const followExercises = plan.exercises.slice(1);
  const isDynamic = theme.id === 'dynamic';

  return (
    <div
      className="relative flex h-full flex-col"
      style={{ backgroundColor: theme.canvasBg, color: theme.textPrimary }}
    >
      {/* 顶部连续吸顶栏 */}
      <div
        className={`absolute inset-x-0 top-0 z-20 ${topSafePad} px-5 pb-3 transition-colors duration-300 flex items-center justify-between gap-3`}
        style={{
          background: headerDocked ? theme.todayDockedHeaderBg : theme.todayHeroTopScrim,
          backdropFilter: headerDocked ? 'blur(20px)' : undefined,
          borderBottom: headerDocked ? `1px solid ${theme.hairlineBorder}` : '1px solid transparent',
        }}
      >
        <div className="min-w-0 flex items-baseline gap-2.5">
          <span
            className="text-[18px] font-semibold tracking-[0.02em] shrink-0"
            style={{
              color: headerDocked
                ? theme.todayDockedHeaderText
                : theme.textPrimary,
            }}
          >
            跟练
          </span>
          <span
            className="text-[12px] truncate transition-opacity duration-200"
            style={{
              color: headerDocked ? theme.todayDockedHeaderSub : theme.textSecondary,
            }}
          >
            {headerDocked ? mainTitle : '第 9 周 · 居家哑铃'}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {headerDocked ? (
            <motion.button
              key="dock-start"
              type="button"
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              onClick={onStartWorkout}
              className="min-h-[36px] px-4 rounded-full text-[12.5px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-transform"
              style={{
                backgroundColor: theme.todayDockedBtnBg,
                color: theme.todayDockedBtnText,
              }}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>开始</span>
            </motion.button>
          ) : (
            <motion.button
              key="dock-setup"
              type="button"
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 4 }}
              transition={{ duration: 0.16 }}
              onClick={() => setShowSetupSheet(true)}
              className="min-h-[36px] px-3 rounded-full backdrop-blur-md text-[12px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: theme.todayUndockedSetupBg,
                color: theme.todayUndockedSetupText,
                border: `1px solid ${
                  isDynamic ? 'rgba(255,255,255,0.18)' : theme.hairlineBorder
                }`,
              }}
            >
              <SlidersHorizontal
                className="w-3.5 h-3.5"
                style={{ color: isDynamic ? '#FF8468' : theme.accent }}
              />
              <span>配重设定</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 主滚动容器 */}
      <div
        onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}
        className={`iphone-scroll flex-1 overflow-y-auto ${bottomScrollPad}`}
      >
        {/* 1. 全幅日光/建筑天窗 Hero */}
        <section
          className={`relative w-full ${heroHeightClass} overflow-hidden`}
          style={{ backgroundColor: theme.surfaceBg }}
        >
          <AnimatePresence mode="sync">
            <motion.div
              key={`${theme.id}-${media.heroUrl}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.36, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
              style={{
                opacity: heroImageOpacity,
                transform: `translate3d(0, ${heroParallaxY}px, 0) scale(${heroScale})`,
              }}
            >
              <img
                src={media.heroUrl}
                alt={plan.title}
                referrerPolicy="no-referrer"
                className={`h-full w-full object-cover object-[50%_42%] ${theme.photoToneFilterClass}`}
              />
              <div className={`pointer-events-none absolute inset-0 ${theme.photoToneTintClass}`} />
            </motion.div>
          </AnimatePresence>

          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: theme.todayHeroBottomGradient }}
          />

          {/* Hero 底部主标题锁组 */}
          <div
            className="absolute inset-x-0 bottom-0 z-10 px-5 pb-3"
            style={{
              opacity: heroCopyOpacity,
              transform: `translate3d(0, ${heroCopyY}px, 0)`,
            }}
          >
            <div
              className="text-[12px] font-semibold tracking-[0.03em]"
              style={{ color: theme.todayHeroKickerColor }}
            >
              {media.kicker}
              {scopeTag ? ` · ${scopeTag}` : ''}
            </div>

            <h1
              className={`mt-1.5 font-semibold tracking-[-0.02em] leading-[1.15] text-balance ${
                isSE ? 'text-[26px]' : 'text-[31px]'
              }`}
              style={{ color: theme.todayHeroTitleColor }}
            >
              {mainTitle}
            </h1>

            <div
              className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono-num text-[12px]"
              style={{ color: theme.todayHeroMetaColor }}
            >
              <span>{plan.estimatedMinutesRange}</span>
              <span aria-hidden="true" className="opacity-35">
                ·
              </span>
              <span>{plan.rounds} 轮循环</span>
              <span aria-hidden="true" className="opacity-35">
                ·
              </span>
              <span className="font-medium" style={{ color: theme.todayHeroMetaAccent }}>
                {activePlate ? activePlate.shortLabel : '徒手无负重'}
              </span>
            </div>
          </div>
        </section>

        {/* 2. 地平线操作与导语基座 */}
        <section
          className="px-5 pt-2 pb-5"
          style={{
            backgroundColor: theme.todayHorizonBg,
            borderBottom: `1px solid ${theme.todayHorizonBorder}`,
          }}
        >
          {postponedNote ? (
            <div
              className="rounded-2xl p-4"
              style={{
                backgroundColor: isDynamic ? 'rgba(255,255,255,0.08)' : theme.surfaceBg,
                border: `1px solid ${theme.todayHorizonBorder}`,
              }}
            >
              <div
                className="text-[12px] font-semibold"
                style={{ color: theme.todayHeroMetaAccent }}
              >
                今日顺延 · 留出恢复余量
              </div>
              <div
                className="mt-1 text-[16px] font-semibold"
                style={{ color: theme.todayHeroTitleColor }}
              >
                已暂缓「{mainTitle}」
              </div>
              <p
                className="mt-1.5 text-[13px] leading-[1.55]"
                style={{ color: theme.todayHorizonIntentColor }}
              >
                恢复是训练节奏的正常部分，顺延不会影响历史记录。也可改做 15 分钟无器械舒展。
              </p>
              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPostponedNote(false)}
                  className="flex-1 h-11 rounded-full text-[13.5px] font-semibold cursor-pointer"
                  style={{
                    backgroundColor: theme.todayHorizonPrimaryBg,
                    color: theme.todayHorizonPrimaryText,
                  }}
                >
                  恢复今日训练
                </button>
                <button
                  type="button"
                  onClick={() => selectPlan(3)}
                  className="h-11 px-4 rounded-full text-[13px] font-medium cursor-pointer"
                  style={{
                    backgroundColor: theme.todayHorizonSecondaryBg,
                    color: theme.todayHorizonSecondaryText,
                  }}
                >
                  改做恢复日
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onStartWorkout}
                  className="flex-1 h-[52px] rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all cursor-pointer shadow-[0_8px_22px_-6px_rgba(0,0,0,0.20)]"
                  style={{
                    backgroundColor: theme.todayHorizonPrimaryBg,
                    color: theme.todayHorizonPrimaryText,
                  }}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>开始今日训练</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSetupSheet(true)}
                  className="h-[52px] px-4 rounded-full text-[13px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-[0.98] transition-all cursor-pointer"
                  style={{
                    backgroundColor: theme.todayHorizonSecondaryBg,
                    border: `1px solid ${theme.todayHorizonSecondaryBorder}`,
                    color: theme.todayHorizonSecondaryText,
                  }}
                >
                  <SlidersHorizontal
                    className="w-3.5 h-3.5"
                    style={{ color: isDynamic ? '#FF8468' : theme.accent }}
                  />
                  <span>配重与休息</span>
                </button>
              </div>

              <div className="mt-3.5 flex items-baseline justify-between gap-4">
                <p
                  className="text-[13px] leading-[1.6]"
                  style={{ color: theme.todayHorizonIntentColor }}
                >
                  {media.intentLine}
                </p>
                <button
                  type="button"
                  onClick={() => setShowSetupSheet(true)}
                  className="font-mono-num text-[12px] font-semibold shrink-0 cursor-pointer hover:underline"
                  style={{ color: theme.todayHeroMetaAccent }}
                >
                  歇 {customRestSeconds}s
                </button>
              </div>
            </>
          )}
        </section>

        {/* 3. 今日动作顺序 */}
        <section className="mt-6 px-5">
          <div className="flex items-baseline justify-between mb-3.5">
            <h2
              className="text-[15.5px] font-semibold tracking-[0.01em]"
              style={{ color: theme.textPrimary }}
            >
              今日动作顺序
            </h2>
            <span className="font-mono-num text-[12px]" style={{ color: theme.textMuted }}>
              点按展开动作详情
            </span>
          </div>

          {leadExercise &&
            (() => {
              const leadAsset = getMoodExerciseMedia(theme, leadExercise);
              return (
                <button
                  type="button"
                  onClick={() => onInspectExerciseIdx(0)}
                  className="w-full text-left group cursor-pointer pb-4"
                  style={{ borderBottom: `1px solid ${theme.hairlineBorder}` }}
                >
                  <div
                    className="relative aspect-[16/9] w-full overflow-hidden rounded-xl"
                    style={{ backgroundColor: theme.surfaceBg }}
                  >
                    <img
                      src={leadAsset.wideUrl}
                      alt={leadExercise.name}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full object-cover ${
                        leadAsset.focalClass ?? 'object-center'
                      } ${theme.photoToneFilterClass} transition-transform duration-500 group-hover:scale-[1.02]`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 ${theme.photoToneTintClass}`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/72 via-black/15 to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-baseline justify-between">
                      <span className="font-mono-num text-[12px] font-semibold text-white/95">
                        01 · {leadExercise.muscleGroup}
                      </span>
                      <span className="font-mono-num text-[12px] font-semibold text-white">
                        {leadExercise.targetReps} {leadExercise.unit} · 节奏 {leadExercise.tempo}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className="text-[16px] font-semibold leading-[1.35]"
                        style={{ color: theme.textPrimary }}
                      >
                        {leadExercise.name}
                      </h3>
                      <p
                        className="mt-0.5 text-[12.5px] leading-[1.45] truncate"
                        style={{ color: theme.textSecondary }}
                      >
                        {leadExercise.targetMuscle} ·{' '}
                        {getExerciseWeightLabel(leadExercise.usesDumbbells)}
                      </p>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 shrink-0 transition-colors"
                      style={{ color: theme.textMuted }}
                    />
                  </div>
                </button>
              );
            })()}

          <div>
            {followExercises.map((ex, idx) => {
              const exIndex = idx + 1;
              const order = idx + 2;
              const asset = getMoodExerciseMedia(theme, ex);

              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => onInspectExerciseIdx(exIndex)}
                  className="w-full py-3.5 flex items-center gap-3.5 text-left group cursor-pointer"
                  style={{ borderBottom: `1px solid ${theme.hairlineBorder}` }}
                >
                  <div
                    className="relative w-[108px] aspect-[4/3] shrink-0 overflow-hidden rounded-lg"
                    style={{ backgroundColor: theme.surfaceBg }}
                  >
                    <img
                      src={asset.wideUrl}
                      alt={ex.name}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full object-cover ${
                        asset.focalClass ?? 'object-center'
                      } ${theme.photoToneFilterClass} transition-transform duration-300 group-hover:scale-[1.03]`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 ${theme.photoToneTintClass}`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/68 via-transparent to-transparent" />
                    <span className="absolute bottom-1 left-1.5 font-mono-num text-[11px] font-semibold text-white">
                      0{order}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3
                        className="text-[15px] font-semibold leading-[1.35] truncate"
                        style={{ color: theme.textPrimary }}
                      >
                        {ex.name}
                      </h3>
                      <span
                        className="font-mono-num text-[12.5px] font-semibold shrink-0"
                        style={{ color: theme.accent }}
                      >
                        {ex.targetReps} {ex.unit}
                      </span>
                    </div>
                    <p
                      className="mt-0.5 text-[12px] leading-[1.45] truncate"
                      style={{ color: theme.textSecondary }}
                    >
                      {ex.targetMuscle}
                    </p>
                    <div
                      className="mt-1 flex items-center gap-1.5 font-mono-num text-[12px]"
                      style={{ color: theme.textMuted }}
                    >
                      <span style={{ color: theme.textSecondary }}>
                        {getExerciseWeightLabel(ex.usesDumbbells)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{ex.tempo}</span>
                      {ex.isUnilateral && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span style={{ color: theme.accent }} className="font-medium">
                            左右各半
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div
            className="mt-3 pt-1 flex items-start gap-2 text-[12px] leading-[1.5]"
            style={{ color: theme.textSecondary }}
          >
            <AlertCircle
              className="w-4 h-4 shrink-0 mt-0.5"
              style={{ color: theme.warning }}
            />
            <span>{USER_CONTEXT.safetyDisclaimer}</span>
          </div>
        </section>

        {/* 4. 更换训练内容 */}
        <section className="mt-7 px-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2
              className="text-[15.5px] font-semibold tracking-[0.01em]"
              style={{ color: theme.textPrimary }}
            >
              更换训练内容
            </h2>
            <span className="text-[12px]" style={{ color: theme.textMuted }}>
              不绑固定星期
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {WORKOUT_OPTIONS.map((opt, idx) => {
              const selected = idx === planIndex && !postponedNote;
              const optMedia = theme.planMedia[opt.id] ?? theme.planMedia['strength-a'];

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectPlan(idx)}
                  className="text-left rounded-xl overflow-hidden transition-all cursor-pointer"
                  style={{
                    backgroundColor: theme.surfaceBg,
                    boxShadow: selected ? `0 0 0 1.5px ${theme.accent}` : undefined,
                    opacity: selected ? 1 : 0.9,
                  }}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <img
                      src={optMedia.wideUrl}
                      alt={opt.title}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full object-cover object-center ${theme.photoToneFilterClass}`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 ${theme.photoToneTintClass}`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/72 via-black/15 to-transparent" />
                    <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between text-[12px]">
                      <span className="font-semibold text-white">{opt.category}</span>
                      {selected && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="px-2.5 pt-2 pb-2.5">
                    <div
                      className="text-[13px] font-semibold truncate"
                      style={{ color: theme.textPrimary }}
                    >
                      {opt.title}
                    </div>
                    <div
                      className="mt-0.5 font-mono-num text-[12px]"
                      style={{ color: theme.textMuted }}
                    >
                      {opt.estimatedMinutesRange}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* 配重片与休息节奏设定抽屉 */}
      <AnimatePresence>
        {showSetupSheet && (
          <motion.div
            key="setup-sheet-backdrop"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
            onClick={() => setShowSetupSheet(false)}
            className="absolute inset-0 z-40 bg-black/45 backdrop-blur-sm flex flex-col justify-end"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 24 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-t-3xl max-h-[84%] flex flex-col ${isSE ? 'pb-5' : 'pb-8'}`}
              style={{
                backgroundColor: theme.canvasBg,
                color: theme.textPrimary,
                borderTop: `1px solid ${theme.hairlineBorder}`,
              }}
            >
              <div
                className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full shrink-0"
                style={{ backgroundColor: theme.hairlineBorder }}
              />
              <div
                className="px-5 pb-3 flex items-center justify-between shrink-0"
                style={{ borderBottom: `1px solid ${theme.hairlineBorder}` }}
              >
                <div>
                  <div className="text-[12px] font-semibold" style={{ color: theme.accent }}>
                    训练前准备
                  </div>
                  <div className="text-[16px] font-semibold" style={{ color: theme.textPrimary }}>
                    哑铃配重与休息节奏
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSetupSheet(false)}
                  aria-label="关闭设定"
                  className="h-10 w-10 rounded-full flex items-center justify-center cursor-pointer"
                  style={{
                    backgroundColor: theme.surfaceBg,
                    color: theme.textSecondary,
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="iphone-scroll flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-5">
                {plan.defaultPlateId !== null ? (
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span
                        className="text-[13.5px] font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        单只哑铃装片组合
                      </span>
                      <span className="text-[12px]" style={{ color: theme.textMuted }}>
                        杆重与承重待确认
                      </span>
                    </div>

                    {activePlate && (
                      <div
                        className="rounded-xl p-3.5 mb-2.5"
                        style={{ backgroundColor: theme.surfaceBg }}
                      >
                        <div
                          className="text-[13px] font-semibold"
                          style={{ color: theme.textPrimary }}
                        >
                          {activePlate.detailLabel}
                        </div>
                        <div
                          className="mt-1 font-mono-num text-[12px]"
                          style={{ color: theme.textSecondary }}
                        >
                          {activePlate.inventoryUsage}
                        </div>
                        {activePlate.cautionNote && (
                          <div
                            className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium"
                            style={{ color: theme.warning }}
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{activePlate.cautionNote}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {PLATE_PRESETS.map((preset) => {
                        const active = activePlate?.id === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => selectPlatePreset(preset)}
                            className="min-h-[46px] px-3 py-2 rounded-xl text-left transition-colors cursor-pointer"
                            style={{
                              backgroundColor: active ? theme.primaryCtaBg : theme.surfaceBg,
                              color: active ? theme.primaryCtaText : theme.textPrimary,
                            }}
                          >
                            <div className="font-mono-num text-[12.5px] font-semibold flex items-center justify-between">
                              <span>
                                {preset.plateSumPerDumbbellKg === 0
                                  ? '仅空杆'
                                  : `片重 ${preset.plateSumPerDumbbellKg} kg`}
                              </span>
                              {active && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            </div>
                            <div
                              className="text-[12px] truncate"
                              style={{
                                opacity: active ? 0.85 : 1,
                                color: active ? theme.primaryCtaText : theme.textMuted,
                              }}
                            >
                              {preset.platesPerSideKg.length === 0
                                ? '0 片/侧'
                                : `每侧 ${preset.platesPerSideKg.join('+')}`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-xl p-3.5 text-[13px]"
                    style={{ backgroundColor: theme.surfaceBg, color: theme.textSecondary }}
                  >
                    当前为纯徒手「恢复日」，无需装配哑铃。
                  </div>
                )}

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span
                      className="text-[13.5px] font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      组间休息时长
                    </span>
                    <span
                      className="font-mono-num text-[12px] font-semibold"
                      style={{ color: theme.accent }}
                    >
                      动作间 {customRestSeconds}s · 轮间 {customRoundRestSeconds}s
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {REST_PRESETS.map((sec) => {
                      const active = customRestSeconds === sec;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setCustomRestSeconds(sec);
                            setCustomRoundRestSeconds(sec + 30);
                          }}
                          className="h-10 rounded-xl font-mono-num text-[13px] font-semibold cursor-pointer transition-colors"
                          style={{
                            backgroundColor: active ? theme.accent : theme.surfaceBg,
                            color: active ? theme.accentContrastText : theme.textSecondary,
                          }}
                        >
                          {sec}s
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setRestAutoAdvance(!restAutoAdvance)}
                    className="mt-2.5 w-full min-h-[44px] px-3.5 rounded-xl flex items-center justify-between text-[13px] cursor-pointer"
                    style={{ backgroundColor: theme.surfaceBg }}
                  >
                    <span style={{ color: theme.textSecondary }}>
                      倒计时结束自动进入下一动作
                    </span>
                    <span className="font-semibold" style={{ color: theme.accent }}>
                      {restAutoAdvance ? '自动推进' : '手动确认'}
                    </span>
                  </button>
                </div>

                <div
                  className="pt-2 flex items-center justify-between gap-2"
                  style={{ borderTop: `1px solid ${theme.hairlineBorder}` }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setPostponedNote(true);
                      setShowSetupSheet(false);
                    }}
                    className="min-h-[44px] px-3.5 rounded-xl text-[12.5px] font-medium cursor-pointer"
                    style={{
                      backgroundColor: theme.surfaceBg,
                      color: theme.textSecondary,
                    }}
                  >
                    今日顺延一天
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSetupSheet(false);
                      onStartWorkout();
                    }}
                    className="flex-1 h-[46px] rounded-full text-[14px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor: theme.primaryCtaBg,
                      color: theme.primaryCtaText,
                    }}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>保存并开练</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
