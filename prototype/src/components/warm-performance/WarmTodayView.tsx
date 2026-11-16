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
import { GlassButton, GlassIconButton, GlassPanel } from './WarmGlass';
import { getWarmExerciseMedia, WARM_PLAN_MEDIA, WARM_TOKENS } from './warmTokens';

interface WarmTodayViewProps {
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

export const WarmTodayView: React.FC<WarmTodayViewProps> = ({
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
  const heroHeightClass = isSE ? 'h-[425px]' : deviceSize === 'standard' ? 'h-[500px]' : 'h-[540px]';

  const media = WARM_PLAN_MEDIA[plan.id] ?? WARM_PLAN_MEDIA['strength-a'];
  const { mainTitle, scopeTag } = splitTitleParts(plan.title);

  const headerDocked = scrollY > 180;
  const heroParallaxY = reduceMotion ? 0 : Math.min(scrollY * 0.26, 96);
  const heroScale = reduceMotion ? 1 : 1 + Math.min(scrollY * 0.00035, 0.07);
  const heroImageOpacity = reduceMotion ? 1 : Math.max(0.35, 1 - scrollY / 390);
  const heroCopyOpacity = reduceMotion ? 1 : Math.max(0, 1 - scrollY / 160);
  const heroCopyY = reduceMotion ? 0 : -Math.min(scrollY * 0.14, 22);

  const leadExercise = plan.exercises[0];
  const followExercises = plan.exercises.slice(1);

  return (
    <div
      className="relative flex h-full flex-col"
      style={{ backgroundColor: WARM_TOKENS.canvasBg, color: WARM_TOKENS.inkPrimary }}
    >
      {/* 顶部连续吸顶栏（融合方案 2 的克制导航与轻量悬浮控制） */}
      <div
        className={`absolute inset-x-0 top-0 z-20 ${topSafePad} px-5 pb-3 transition-colors duration-300 flex items-center justify-between gap-3 ${
          headerDocked ? 'warm-lg-header-blur' : ''
        }`}
        style={{
          background: headerDocked
            ? undefined
            : 'linear-gradient(180deg, rgba(249,247,243,0.58) 0%, rgba(249,247,243,0.22) 56%, rgba(249,247,243,0) 100%)',
        }}
      >
        <div className="min-w-0 flex items-baseline gap-2.5">
          <span
            className="text-[18px] font-semibold tracking-[0.015em] shrink-0"
            style={{ color: WARM_TOKENS.inkPrimary }}
          >
            跟练
          </span>
          <span
            className="text-[12px] font-medium truncate transition-opacity duration-200"
            style={{ color: headerDocked ? WARM_TOKENS.inkMuted : WARM_TOKENS.inkPrimary }}
          >
            {headerDocked ? mainTitle : '第 9 周 · 居家哑铃'}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {headerDocked ? (
            <motion.button
              key="warm-dock-start"
              type="button"
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              onClick={onStartWorkout}
              className="min-h-[36px] px-4 rounded-full text-[12.5px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-transform"
              style={{
                backgroundColor: WARM_TOKENS.accent,
                color: WARM_TOKENS.accentContrastText,
              }}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>开始</span>
            </motion.button>
          ) : (
            <motion.button
              key="warm-dock-setup"
              type="button"
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 4 }}
              transition={{ duration: 0.16 }}
              onClick={() => setShowSetupSheet(true)}
              className="warm-lg-control warm-lg-interactive min-h-[36px] px-3.5 rounded-full text-[12px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                color: WARM_TOKENS.inkPrimary,
              }}
            >
              <SlidersHorizontal
                className="w-3.5 h-3.5"
                style={{ color: WARM_TOKENS.accentTextOnLight }}
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
        {/* 1. 全幅晨光 Hero（方案 1 温润运动沉浸 × 方案 2 干净留白排版） */}
        <section
          className={`relative w-full ${heroHeightClass} overflow-hidden`}
          style={{ backgroundColor: WARM_TOKENS.surfaceBg }}
        >
          <AnimatePresence mode="sync">
            <motion.div
              key={media.heroUrl}
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
                className={`h-full w-full object-cover ${
                  media.heroFocalClass ?? 'object-[50%_42%]'
                } ${WARM_TOKENS.photoFilterClass}`}
              />
              <div
                className={`pointer-events-none absolute inset-0 ${WARM_TOKENS.photoCoolAirTintClass}`}
              />
            </motion.div>
          </AnimatePresence>

          {/* 多段无缝过渡到矿物白画布 */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: WARM_TOKENS.heroBottomScrim }}
          />

          {/* Hero 底部标题锁组 */}
          <div
            className="absolute inset-x-0 bottom-0 z-10 px-5 pb-3.5"
            style={{
              opacity: heroCopyOpacity,
              transform: `translate3d(0, ${heroCopyY}px, 0)`,
            }}
          >
            <div
              className="text-[12px] font-semibold tracking-[0.03em]"
              style={{ color: WARM_TOKENS.accentTextOnLight }}
            >
              {media.kicker}
              {scopeTag ? ` · ${scopeTag}` : ''}
            </div>

            <h1
              className={`mt-1.5 font-semibold tracking-[-0.025em] leading-[1.14] text-balance ${
                isSE ? 'text-[26px]' : 'text-[31px]'
              }`}
              style={{ color: WARM_TOKENS.inkPrimary }}
            >
              {mainTitle}
            </h1>

            <div
              className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono-num text-[12px]"
              style={{ color: WARM_TOKENS.inkSecondary }}
            >
              <span>{plan.estimatedMinutesRange}</span>
              <span aria-hidden="true" className="opacity-30">
                ·
              </span>
              <span>{plan.rounds} 轮循环</span>
              <span aria-hidden="true" className="opacity-30">
                ·
              </span>
              <span className="font-medium" style={{ color: WARM_TOKENS.accentTextOnLight }}>
                {activePlate ? activePlate.shortLabel : '徒手无负重'}
              </span>
            </div>
          </div>
        </section>

        {/* 2. 地平线主行动区：单一高意向品牌橙 CTA + 精密文字信息 */}
        <section
          className="px-5 pt-2 pb-5"
          style={{
            backgroundColor: WARM_TOKENS.canvasBg,
            borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}`,
          }}
        >
          {postponedNote ? (
            <GlassPanel variant="chip" className="rounded-2xl p-4">
              <div
                className="text-[12px] font-semibold"
                style={{ color: WARM_TOKENS.auxSlate }}
              >
                今日顺延 · 留出恢复余量
              </div>
              <div
                className="mt-1 text-[16px] font-semibold"
                style={{ color: WARM_TOKENS.inkPrimary }}
              >
                已暂缓「{mainTitle}」
              </div>
              <p
                className="mt-1.5 text-[13px] leading-[1.58]"
                style={{ color: WARM_TOKENS.inkSecondary }}
              >
                恢复是长期训练节律的一部分，顺延不会影响档案连续性。也可改做 15 分钟无器械舒展。
              </p>
              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPostponedNote(false)}
                  className="flex-1 h-11 rounded-full text-[13.5px] font-semibold cursor-pointer active:scale-[0.98] transition-transform"
                  style={{
                    backgroundColor: WARM_TOKENS.accent,
                    color: WARM_TOKENS.accentContrastText,
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.32), 0 8px 18px -6px rgba(212,78,36,0.36)',
                  }}
                >
                  恢复今日训练
                </button>
                <GlassButton
                  onClick={() => selectPlan(3)}
                  className="h-11 px-4 text-[13px] font-medium"
                >
                  改做恢复日
                </GlassButton>
              </div>
            </GlassPanel>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onStartWorkout}
                  className="flex-1 h-[52px] rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                  style={{
                    backgroundColor: WARM_TOKENS.accent,
                    color: WARM_TOKENS.accentContrastText,
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.34), 0 10px 24px -8px rgba(212,78,36,0.42)',
                  }}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>开始今日训练</span>
                </button>

                <GlassButton
                  onClick={() => setShowSetupSheet(true)}
                  className="h-[52px] px-4 text-[13px] font-medium gap-1.5 whitespace-nowrap shrink-0"
                >
                  <SlidersHorizontal
                    className="w-3.5 h-3.5"
                    style={{ color: WARM_TOKENS.accentTextOnLight }}
                  />
                  <span>配重与休息</span>
                </GlassButton>
              </div>

              <div className="mt-3.5 flex items-baseline justify-between gap-4">
                <p
                  className="text-[13px] leading-[1.6]"
                  style={{ color: WARM_TOKENS.inkSecondary }}
                >
                  {media.intentLine}
                </p>
                <button
                  type="button"
                  onClick={() => setShowSetupSheet(true)}
                  className="font-mono-num text-[12px] font-semibold shrink-0 cursor-pointer hover:underline"
                  style={{ color: WARM_TOKENS.auxSlate }}
                >
                  歇 {customRestSeconds}s
                </button>
              </div>
            </>
          )}
        </section>

        {/* 3. 今日动作顺序（精密分隔线 + 完整动作构图） */}
        <section className="mt-6 px-5">
          <div className="flex items-baseline justify-between mb-3.5">
            <h2
              className="text-[15.5px] font-semibold tracking-[0.005em]"
              style={{ color: WARM_TOKENS.inkPrimary }}
            >
              今日动作顺序
            </h2>
            <span className="font-mono-num text-[12px]" style={{ color: WARM_TOKENS.inkMuted }}>
              点按展开动作详情
            </span>
          </div>

          {leadExercise &&
            (() => {
              const leadAsset = getWarmExerciseMedia(leadExercise);
              return (
                <button
                  type="button"
                  onClick={() => onInspectExerciseIdx(0)}
                  className="w-full text-left group cursor-pointer pb-4"
                  style={{ borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}` }}
                >
                  <div
                    className="relative aspect-[16/9] w-full overflow-hidden rounded-xl"
                    style={{ backgroundColor: WARM_TOKENS.surfaceBackdropStudio }}
                  >
                    <img
                      src={leadAsset.wideUrl}
                      alt={leadExercise.name}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full ${
                        leadAsset.wideContain
                          ? 'object-contain'
                          : `object-cover ${
                              leadAsset.wideFocalClass ?? leadAsset.focalClass ?? 'object-center'
                            }`
                      } ${WARM_TOKENS.photoFilterClass} transition-transform duration-500 group-hover:scale-[1.02]`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 ${WARM_TOKENS.photoCoolAirTintClass}`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/82 via-black/26 to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-baseline justify-between drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                      <span className="font-mono-num text-[12px] font-semibold text-white">
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
                        style={{ color: WARM_TOKENS.inkPrimary }}
                      >
                        {leadExercise.name}
                      </h3>
                      <p
                        className="mt-0.5 text-[12.5px] leading-[1.45] truncate"
                        style={{ color: WARM_TOKENS.inkSecondary }}
                      >
                        {leadExercise.targetMuscle} ·{' '}
                        {getExerciseWeightLabel(leadExercise.usesDumbbells)}
                      </p>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 shrink-0 transition-colors"
                      style={{ color: WARM_TOKENS.inkMuted }}
                    />
                  </div>
                </button>
              );
            })()}

          <div>
            {followExercises.map((ex, idx) => {
              const exIndex = idx + 1;
              const order = idx + 2;
              const asset = getWarmExerciseMedia(ex);

              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => onInspectExerciseIdx(exIndex)}
                  className="w-full py-3.5 flex items-center gap-3.5 text-left group cursor-pointer"
                  style={{ borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}` }}
                >
                  <div
                    className="relative w-[108px] aspect-[4/3] shrink-0 overflow-hidden rounded-lg"
                    style={{ backgroundColor: WARM_TOKENS.surfaceBackdropStudio }}
                  >
                    <img
                      src={asset.wideUrl}
                      alt={ex.name}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full ${
                        asset.wideContain
                          ? 'object-contain'
                          : `object-cover ${
                              asset.wideFocalClass ?? asset.focalClass ?? 'object-center'
                            }`
                      } ${WARM_TOKENS.photoFilterClass} transition-transform duration-300 group-hover:scale-[1.03]`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 ${WARM_TOKENS.photoCoolAirTintClass}`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/22 to-transparent" />
                    <span className="absolute bottom-1 left-1.5 font-mono-num text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                      {String(order).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3
                        className="text-[15px] font-semibold leading-[1.35] truncate"
                        style={{ color: WARM_TOKENS.inkPrimary }}
                      >
                        {ex.name}
                      </h3>
                      <span
                        className="font-display-b text-[15px] font-semibold shrink-0 tabular-nums"
                        style={{ color: WARM_TOKENS.accentTextOnLight }}
                      >
                        {ex.targetReps} {ex.unit}
                      </span>
                    </div>
                    <p
                      className="mt-0.5 text-[12px] leading-[1.45] truncate"
                      style={{ color: WARM_TOKENS.inkSecondary }}
                    >
                      {ex.targetMuscle}
                    </p>
                    <div
                      className="mt-1 flex items-center gap-1.5 font-mono-num text-[12px]"
                      style={{ color: WARM_TOKENS.inkMuted }}
                    >
                      <span style={{ color: WARM_TOKENS.inkSecondary }}>
                        {getExerciseWeightLabel(ex.usesDumbbells)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{ex.tempo}</span>
                      {ex.isUnilateral && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span style={{ color: WARM_TOKENS.auxSlate }} className="font-medium">
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
            className="mt-3.5 pt-1 flex items-start gap-2 text-[12px] leading-[1.55]"
            style={{ color: WARM_TOKENS.inkSecondary }}
          >
            <AlertCircle
              className="w-4 h-4 shrink-0 mt-0.5"
              style={{ color: WARM_TOKENS.warning }}
            />
            <span>{USER_CONTEXT.safetyDisclaimer}</span>
          </div>
        </section>

        {/* 4. 更换训练内容 */}
        <section className="mt-7 px-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2
              className="text-[15.5px] font-semibold tracking-[0.005em]"
              style={{ color: WARM_TOKENS.inkPrimary }}
            >
              更换训练内容
            </h2>
            <span className="text-[12px]" style={{ color: WARM_TOKENS.inkMuted }}>
              不绑固定星期
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {WORKOUT_OPTIONS.map((opt, idx) => {
              const selected = idx === planIndex && !postponedNote;
              const optMedia = WARM_PLAN_MEDIA[opt.id] ?? WARM_PLAN_MEDIA['strength-a'];

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectPlan(idx)}
                  className="text-left rounded-xl overflow-hidden transition-all cursor-pointer"
                  style={{
                    backgroundColor: selected ? WARM_TOKENS.surfaceWhiteLift : WARM_TOKENS.surfaceBg,
                    boxShadow: selected
                      ? `0 0 0 1.5px ${WARM_TOKENS.accent}`
                      : `inset 0 0 0 1px ${WARM_TOKENS.hairlineBorder}`,
                    opacity: selected ? 1 : 0.92,
                  }}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <img
                      src={optMedia.wideUrl}
                      alt={opt.title}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full object-cover object-center ${WARM_TOKENS.photoFilterClass}`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 ${WARM_TOKENS.photoCoolAirTintClass}`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/82 via-black/26 to-transparent" />
                    <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between text-[12px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                      <span className="font-semibold text-white">{opt.category}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                    </div>
                  </div>
                  <div className="px-2.5 pt-2 pb-2.5">
                    <div
                      className="text-[13px] font-semibold truncate"
                      style={{ color: WARM_TOKENS.inkPrimary }}
                    >
                      {opt.title}
                    </div>
                    <div
                      className="mt-0.5 font-mono-num text-[12px]"
                      style={{ color: WARM_TOKENS.inkMuted }}
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
            key="warm-setup-sheet-backdrop"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
            onClick={() => setShowSetupSheet(false)}
            className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex flex-col justify-end"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 24 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="warm-lg-sheet rounded-t-3xl max-h-[84%] flex flex-col"
              style={{
                color: WARM_TOKENS.inkPrimary,
                paddingBottom: `calc(${isSE ? '20px' : '28px'} + env(safe-area-inset-bottom, 0px))`,
              }}
            >
              <div
                className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full shrink-0"
                style={{ backgroundColor: WARM_TOKENS.hairlineStrong }}
              />
              <div
                className="px-5 pb-3 flex items-center justify-between shrink-0"
                style={{ borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}` }}
              >
                <div>
                  <div
                    className="text-[12px] font-semibold"
                    style={{ color: WARM_TOKENS.accentTextOnLight }}
                  >
                    训练前准备
                  </div>
                  <div
                    className="text-[16px] font-semibold"
                    style={{ color: WARM_TOKENS.inkPrimary }}
                  >
                    哑铃配重与休息节奏
                  </div>
                </div>
                <GlassIconButton
                  onClick={() => setShowSetupSheet(false)}
                  aria-label="关闭设定"
                  className="h-10 w-10"
                  style={{
                    color: WARM_TOKENS.inkSecondary,
                  }}
                >
                  <X className="w-4 h-4" />
                </GlassIconButton>
              </div>

              <div className="iphone-scroll flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-5">
                {plan.defaultPlateId !== null ? (
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span
                        className="text-[13.5px] font-semibold"
                        style={{ color: WARM_TOKENS.inkPrimary }}
                      >
                        单只哑铃装片组合
                      </span>
                      <span className="text-[12px]" style={{ color: WARM_TOKENS.inkMuted }}>
                        杆重与承重待确认
                      </span>
                    </div>

                    {activePlate && (
                      <GlassPanel variant="chip" className="rounded-xl p-3.5 mb-2.5">
                        <div
                          className="text-[13px] font-semibold"
                          style={{ color: WARM_TOKENS.inkPrimary }}
                        >
                          {activePlate.detailLabel}
                        </div>
                        <div
                          className="mt-1 font-mono-num text-[12px]"
                          style={{ color: WARM_TOKENS.inkSecondary }}
                        >
                          {activePlate.inventoryUsage}
                        </div>
                        {activePlate.cautionNote && (
                          <div
                            className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium"
                            style={{ color: WARM_TOKENS.warning }}
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{activePlate.cautionNote}</span>
                          </div>
                        )}
                      </GlassPanel>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {PLATE_PRESETS.map((preset) => {
                        const active = activePlate?.id === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => selectPlatePreset(preset)}
                            className={`min-h-[46px] px-3 py-2 rounded-xl text-left transition-all cursor-pointer active:scale-[0.98] ${
                              active ? '' : 'warm-lg-chip'
                            }`}
                            style={{
                              backgroundColor: active ? WARM_TOKENS.graphiteCtaBg : undefined,
                              color: active
                                ? WARM_TOKENS.graphiteCtaText
                                : WARM_TOKENS.inkPrimary,
                              boxShadow: active
                                ? 'inset 0 1px 0 rgba(255,255,255,0.14), 0 6px 16px -6px rgba(25,29,34,0.28)'
                                : undefined,
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
                                color: active ? WARM_TOKENS.graphiteCtaText : WARM_TOKENS.inkSecondary,
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
                  <GlassPanel
                    variant="chip"
                    className="rounded-xl p-3.5 text-[13px]"
                    style={{
                      color: WARM_TOKENS.inkSecondary,
                    }}
                  >
                    当前为纯徒手「恢复日」，无需装配哑铃。
                  </GlassPanel>
                )}

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span
                      className="text-[13.5px] font-semibold"
                      style={{ color: WARM_TOKENS.inkPrimary }}
                    >
                      组间休息时长
                    </span>
                    <span
                      className="font-mono-num text-[12px] font-semibold"
                      style={{ color: WARM_TOKENS.auxSlate }}
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
                          className={`h-10 rounded-xl font-mono-num text-[13px] font-semibold cursor-pointer transition-all active:scale-95 ${
                            active ? '' : 'warm-lg-chip'
                          }`}
                          style={{
                            backgroundColor: active ? WARM_TOKENS.accent : undefined,
                            color: active
                              ? WARM_TOKENS.accentContrastText
                              : WARM_TOKENS.inkSecondary,
                            boxShadow: active
                              ? 'inset 0 1px 0 rgba(255,255,255,0.28), 0 6px 14px -5px rgba(212,78,36,0.34)'
                              : undefined,
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
                    className="warm-lg-chip mt-2.5 w-full min-h-[44px] px-3.5 rounded-xl flex items-center justify-between text-[13px] cursor-pointer active:scale-[0.99]"
                  >
                    <span style={{ color: WARM_TOKENS.inkSecondary }}>
                      倒计时结束自动进入下一动作
                    </span>
                    <span className="font-semibold" style={{ color: WARM_TOKENS.accentTextOnLight }}>
                      {restAutoAdvance ? '自动推进' : '手动确认'}
                    </span>
                  </button>
                </div>

                <div
                  className="pt-2 flex items-center justify-between gap-2"
                  style={{ borderTop: `1px solid ${WARM_TOKENS.hairlineBorder}` }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setPostponedNote(true);
                      setShowSetupSheet(false);
                    }}
                    className="warm-lg-chip min-h-[44px] px-3.5 rounded-xl text-[12.5px] font-medium cursor-pointer active:scale-[0.98]"
                    style={{
                      color: WARM_TOKENS.inkSecondary,
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
                    className="flex-1 h-[46px] rounded-full text-[14px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all"
                    style={{
                      backgroundColor: WARM_TOKENS.accent,
                      color: WARM_TOKENS.accentContrastText,
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.32), 0 8px 18px -6px rgba(212,78,36,0.36)',
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
