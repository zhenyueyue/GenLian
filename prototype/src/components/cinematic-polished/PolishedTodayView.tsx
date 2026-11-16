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
import {
  getPolishedExerciseMedia,
  POLISHED_PLAN_MEDIA,
} from './polishedMedia';

interface PolishedTodayViewProps {
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

/**
 * 1. 今日首页（艺术指导构图精修版）
 * - 留出完整中段无遮挡动作影像：Hero 仅承接克制标题与轻量参数，将操作按钮与导语安放于清晰的地平线基座
 * - 滚动驱动 Hero 视差、柔和渐隐与顶栏无缝吸顶切换
 * - 点击任意动作自然扩展进入全屏「动作详情页」（取代传统底部弹窗）
 */
export const PolishedTodayView: React.FC<PolishedTodayViewProps> = ({
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

  const media = POLISHED_PLAN_MEDIA[plan.id] ?? POLISHED_PLAN_MEDIA['strength-a'];
  const { mainTitle, scopeTag } = splitTitleParts(plan.title);

  // 滚动连续过渡指标（仅 compositor transform / opacity）
  const headerDocked = scrollY > 185;
  const heroParallaxY = reduceMotion ? 0 : Math.min(scrollY * 0.28, 100);
  const heroScale = reduceMotion ? 1 : 1 + Math.min(scrollY * 0.0004, 0.08);
  const heroImageOpacity = reduceMotion ? 1 : Math.max(0.28, 1 - scrollY / 380);
  const heroCopyOpacity = reduceMotion ? 1 : Math.max(0, 1 - scrollY / 165);
  const heroCopyY = reduceMotion ? 0 : -Math.min(scrollY * 0.14, 24);

  const leadExercise = plan.exercises[0];
  const followExercises = plan.exercises.slice(1);

  return (
    <div className="relative flex h-full flex-col bg-[#11100F] text-[#F2EDE4]">
      {/* 连续吸顶导航栏：随滚动从透明暮色自然切换为沉稳磨砂顶栏 */}
      <div
        className={`absolute inset-x-0 top-0 z-20 ${topSafePad} px-5 pb-3 transition-colors duration-300 flex items-center justify-between gap-3 ${
          headerDocked
            ? 'bg-[#11100F]/90 backdrop-blur-xl border-b border-[#F2EDE4]/10'
            : 'bg-gradient-to-b from-[#11100F]/52 via-[#11100F]/14 to-transparent'
        }`}
      >
        <div className="min-w-0 flex items-baseline gap-2.5">
          <span className="text-[18px] font-semibold tracking-[0.02em] text-[#F2EDE4] shrink-0">
            跟练
          </span>
          <span className="text-[12px] text-[#C7BFB4] truncate transition-opacity duration-200">
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
              className="min-h-[36px] px-4 rounded-full bg-[#F2EDE4] text-[#11100F] text-[12.5px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-transform"
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
              className="min-h-[36px] px-3 rounded-full bg-[#11100F]/42 backdrop-blur-md border border-[#F2EDE4]/16 text-[12px] font-medium text-[#F2EDE4] hover:bg-[#1A1816]/85 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D9BE94]" />
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
        {/* 1. 全幅 Hero：留出清晰中段人物动作姿态，仅于底部地平线置入主标题锁组 */}
        <section className={`relative w-full ${heroHeightClass} overflow-hidden bg-[#11100F]`}>
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
                className="h-full w-full object-cover object-[50%_42%]"
              />
            </motion.div>
          </AnimatePresence>

          {/* 精修渐变过渡：中段 58% 完全通透，底部优雅融入 #11100F 画布 */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(17,16,15,0.44) 0%, rgba(17,16,15,0) 26%, rgba(17,16,15,0) 58%, rgba(17,16,15,0.74) 84%, #11100F 100%)',
            }}
          />

          {/* Hero 底部精修主标题锁组（移除拥挤按钮与多行说明，留出呼吸感） */}
          <div
            className="absolute inset-x-0 bottom-0 z-10 px-5 pb-3"
            style={{
              opacity: heroCopyOpacity,
              transform: `translate3d(0, ${heroCopyY}px, 0)`,
            }}
          >
            <div className="text-[12px] font-medium text-[#D9BE94] tracking-[0.03em]">
              {media.kicker}
              {scopeTag ? ` · ${scopeTag}` : ''}
            </div>

            <h1
              className={`mt-1.5 font-semibold tracking-[-0.02em] text-[#F2EDE4] leading-[1.15] text-balance ${
                isSE ? 'text-[26px]' : 'text-[31px]'
              }`}
            >
              {mainTitle}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono-num text-[12px] text-[#D8D0C5]">
              <span>{plan.estimatedMinutesRange}</span>
              <span aria-hidden="true" className="text-[#F2EDE4]/30">·</span>
              <span>{plan.rounds} 轮循环</span>
              <span aria-hidden="true" className="text-[#F2EDE4]/30">·</span>
              <span className="text-[#D9BE94]">
                {activePlate ? activePlate.shortLabel : '徒手无负重'}
              </span>
            </div>
          </div>
        </section>

        {/* 2. 地平线操作与导语基座（独立于影像之外的清晰节奏承接） */}
        <section className="px-5 pt-2 pb-5 border-b border-[#F2EDE4]/10 bg-[#11100F]">
          {postponedNote ? (
            <div className="rounded-2xl bg-[#191715] border border-[#F2EDE4]/12 p-4">
              <div className="text-[12px] font-medium text-[#D9BE94]">
                今日顺延 · 留出恢复余量
              </div>
              <div className="mt-1 text-[16px] font-semibold text-[#F2EDE4]">
                已暂缓「{mainTitle}」
              </div>
              <p className="mt-1.5 text-[13px] text-[#B8AFA4] leading-[1.55]">
                恢复是训练节奏的正常部分，顺延不会影响历史记录。也可改做 15 分钟无器械舒展。
              </p>
              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPostponedNote(false)}
                  className="flex-1 h-11 rounded-full bg-[#F2EDE4] text-[#11100F] text-[13.5px] font-semibold cursor-pointer"
                >
                  恢复今日训练
                </button>
                <button
                  type="button"
                  onClick={() => selectPlan(3)}
                  className="h-11 px-4 rounded-full bg-[#F2EDE4]/12 text-[#F2EDE4] text-[13px] font-medium cursor-pointer"
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
                  className="flex-1 h-[52px] rounded-full bg-[#F2EDE4] text-[#11100F] text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-white active:scale-[0.985] transition-all cursor-pointer shadow-[0_10px_28px_-6px_rgba(0,0,0,0.48)]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>开始今日训练</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSetupSheet(true)}
                  className="h-[52px] px-4 rounded-full bg-[#191715] border border-[#F2EDE4]/14 text-[#F2EDE4] text-[13px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-[#23201D] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#D9BE94]" />
                  <span>配重与休息</span>
                </button>
              </div>

              <div className="mt-3.5 flex items-baseline justify-between gap-4">
                <p className="text-[13px] text-[#B8AFA4] leading-[1.6]">{media.intentLine}</p>
                <button
                  type="button"
                  onClick={() => setShowSetupSheet(true)}
                  className="font-mono-num text-[12px] text-[#D9BE94] shrink-0 cursor-pointer hover:underline"
                >
                  歇 {customRestSeconds}s
                </button>
              </div>
            </>
          )}
        </section>

        {/* 3. 今日动作顺序（点击任意项连续展开全屏动作详情） */}
        <section className="mt-6 px-5">
          <div className="flex items-baseline justify-between mb-3.5">
            <h2 className="text-[15.5px] font-semibold text-[#F2EDE4] tracking-[0.01em]">
              今日动作顺序
            </h2>
            <span className="font-mono-num text-[12px] text-[#948B80]">
              点按展开动作详情
            </span>
          </div>

          {leadExercise && (() => {
            const leadAsset = getPolishedExerciseMedia(leadExercise);
            return (
              <button
                type="button"
                onClick={() => onInspectExerciseIdx(0)}
                className="w-full text-left group cursor-pointer pb-4 border-b border-[#F2EDE4]/8"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#1A1816]">
                  <img
                    src={leadAsset.wideUrl}
                    alt={leadExercise.name}
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-cover ${
                      leadAsset.focalClass ?? 'object-center'
                    } transition-transform duration-500 group-hover:scale-[1.02]`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#11100F]/82 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-baseline justify-between">
                    <span className="font-mono-num text-[12px] font-medium text-[#D9BE94]">
                      01 · {leadExercise.muscleGroup}
                    </span>
                    <span className="font-mono-num text-[12px] font-semibold text-[#F2EDE4]">
                      {leadExercise.targetReps} {leadExercise.unit} · 节奏 {leadExercise.tempo}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-medium text-[#F2EDE4] leading-[1.35]">
                      {leadExercise.name}
                    </h3>
                    <p className="mt-0.5 text-[12.5px] text-[#B8AFA4] leading-[1.45] truncate">
                      {leadExercise.targetMuscle} · {getExerciseWeightLabel(leadExercise.usesDumbbells)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#948B80] group-hover:text-[#F2EDE4] shrink-0" />
                </div>
              </button>
            );
          })()}

          <div className="divide-y divide-[#F2EDE4]/8">
            {followExercises.map((ex, idx) => {
              const exIndex = idx + 1;
              const order = idx + 2;
              const asset = getPolishedExerciseMedia(ex);

              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => onInspectExerciseIdx(exIndex)}
                  className="w-full py-3.5 flex items-center gap-3.5 text-left group cursor-pointer"
                >
                  <div className="relative w-[108px] aspect-[4/3] shrink-0 overflow-hidden rounded-lg bg-[#1A1816]">
                    <img
                      src={asset.wideUrl}
                      alt={ex.name}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full object-cover ${
                        asset.focalClass ?? 'object-center'
                      } transition-transform duration-300 group-hover:scale-[1.03]`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#11100F]/75 via-transparent to-transparent" />
                    <span className="absolute bottom-1 left-1.5 font-mono-num text-[11px] font-medium text-[#D9BE94]">
                      0{order}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-[15px] font-medium text-[#F2EDE4] leading-[1.35] truncate">
                        {ex.name}
                      </h3>
                      <span className="font-mono-num text-[12.5px] font-semibold text-[#D9BE94] shrink-0">
                        {ex.targetReps} {ex.unit}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-[#B8AFA4] leading-[1.45] truncate">
                      {ex.targetMuscle}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 font-mono-num text-[12px] text-[#948B80]">
                      <span className="text-[#D8D0C5]">
                        {getExerciseWeightLabel(ex.usesDumbbells)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{ex.tempo}</span>
                      {ex.isUnilateral && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#D9BE94]">左右各半</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-[#F2EDE4]/8 flex items-start gap-2 text-[12px] text-[#B8AFA4] leading-[1.5]">
            <AlertCircle className="w-4 h-4 text-[#D88A38] shrink-0 mt-0.5" />
            <span>{USER_CONTEXT.safetyDisclaimer}</span>
          </div>
        </section>

        {/* 4. 更换训练内容 */}
        <section className="mt-7 px-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15.5px] font-semibold text-[#F2EDE4] tracking-[0.01em]">
              更换训练内容
            </h2>
            <span className="text-[12px] text-[#948B80]">不绑固定星期</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {WORKOUT_OPTIONS.map((opt, idx) => {
              const selected = idx === planIndex && !postponedNote;
              const optMedia =
                POLISHED_PLAN_MEDIA[opt.id] ?? POLISHED_PLAN_MEDIA['strength-a'];

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectPlan(idx)}
                  className={`text-left rounded-xl overflow-hidden bg-[#1A1816] transition-all cursor-pointer ${
                    selected
                      ? 'ring-1 ring-[#D9BE94]/80'
                      : 'opacity-88 hover:opacity-100'
                  }`}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <img
                      src={optMedia.wideUrl}
                      alt={opt.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-center"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A1816] via-[#1A1816]/20 to-transparent" />
                    <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between text-[12px]">
                      <span className={selected ? 'text-[#D9BE94] font-semibold' : 'text-[#F2EDE4]'}>
                        {opt.category}
                      </span>
                      {selected && <Check className="w-3.5 h-3.5 text-[#D9BE94]" />}
                    </div>
                  </div>
                  <div className="px-2.5 pt-1 pb-2.5">
                    <div className="text-[13px] font-medium text-[#F2EDE4] truncate">
                      {opt.title}
                    </div>
                    <div className="mt-0.5 font-mono-num text-[12px] text-[#948B80]">
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
            className="absolute inset-0 z-40 bg-[#11100F]/80 backdrop-blur-sm flex flex-col justify-end"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 24 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-t-3xl bg-[#1A1816] border-t border-[#F2EDE4]/12 max-h-[84%] flex flex-col ${
                isSE ? 'pb-5' : 'pb-8'
              }`}
            >
              <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-[#F2EDE4]/20 shrink-0" />
              <div className="px-5 pb-3 border-b border-[#F2EDE4]/8 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-[12px] text-[#D9BE94]">训练前准备</div>
                  <div className="text-[16px] font-semibold text-[#F2EDE4]">
                    哑铃配重与休息节奏
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSetupSheet(false)}
                  aria-label="关闭设定"
                  className="h-10 w-10 rounded-full bg-[#F2EDE4]/8 flex items-center justify-center text-[#B8AFA4] hover:text-[#F2EDE4] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="iphone-scroll flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-5">
                {plan.defaultPlateId !== null ? (
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[13.5px] font-semibold text-[#F2EDE4]">
                        单只哑铃装片组合
                      </span>
                      <span className="text-[12px] text-[#948B80]">杆重与承重待确认</span>
                    </div>

                    {activePlate && (
                      <div className="rounded-xl bg-[#23201D] p-3.5 mb-2.5">
                        <div className="text-[13px] font-medium text-[#F2EDE4]">
                          {activePlate.detailLabel}
                        </div>
                        <div className="mt-1 font-mono-num text-[12px] text-[#B8AFA4]">
                          {activePlate.inventoryUsage}
                        </div>
                        {activePlate.cautionNote && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#D88A38]">
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
                            className={`min-h-[46px] px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#F2EDE4] text-[#11100F]'
                                : 'bg-[#23201D] text-[#D8D0C5] hover:bg-[#2C2824]'
                            }`}
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
                              className={`text-[12px] truncate ${
                                active ? 'text-[#4A433B]' : 'text-[#948B80]'
                              }`}
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
                  <div className="rounded-xl bg-[#23201D] p-3.5 text-[13px] text-[#B8AFA4]">
                    当前为纯徒手「恢复日」，无需装配哑铃。
                  </div>
                )}

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[13.5px] font-semibold text-[#F2EDE4]">组间休息时长</span>
                    <span className="font-mono-num text-[12px] text-[#D9BE94]">
                      动作间 {customRestSeconds}s · 轮间 {customRoundRestSeconds}s
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {REST_PRESETS.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          setCustomRestSeconds(sec);
                          setCustomRoundRestSeconds(sec + 30);
                        }}
                        className={`h-10 rounded-xl font-mono-num text-[13px] font-semibold cursor-pointer transition-colors ${
                          customRestSeconds === sec
                            ? 'bg-[#B54B35] text-[#F2EDE4]'
                            : 'bg-[#23201D] text-[#B8AFA4] hover:text-[#F2EDE4]'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setRestAutoAdvance(!restAutoAdvance)}
                    className="mt-2.5 w-full min-h-[44px] px-3.5 rounded-xl bg-[#23201D] flex items-center justify-between text-[13px] cursor-pointer"
                  >
                    <span className="text-[#D8D0C5]">倒计时结束自动进入下一动作</span>
                    <span className="font-semibold text-[#D9BE94]">
                      {restAutoAdvance ? '自动推进' : '手动确认'}
                    </span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#F2EDE4]/8 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPostponedNote(true);
                      setShowSetupSheet(false);
                    }}
                    className="min-h-[44px] px-3.5 rounded-xl bg-[#23201D] text-[12.5px] text-[#B8AFA4] hover:text-[#F2EDE4] cursor-pointer"
                  >
                    今日顺延一天
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSetupSheet(false);
                      onStartWorkout();
                    }}
                    className="flex-1 h-[46px] rounded-full bg-[#F2EDE4] text-[#11100F] text-[14px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
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
