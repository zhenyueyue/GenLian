import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Film,
  Play,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { USER_CONTEXT, WORKOUT_OPTIONS } from '../../data/workouts';
import { useWorkoutSimulator } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';
import { CINEMA_POSTER_BY_PLAN } from './cinematicMedia';

interface CinematicTodayViewProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
  onStartWorkout: () => void;
  onOpenArchive: () => void;
}

const REST_PRESETS = [30, 60, 90, 120];

/**
 * 「今天」沉浸式训练首页（Cinematic Fitness）
 * - 内容优先、界面退后：70% 全幅电影海报式 Hero + 温和暗角渐变 + 暖象牙白主触发
 * - 动作列表以 16:9 宽银幕分镜缩略图呈现，配重与休息参数收拢于底部制作抽屉，保持首页视觉纯粹与安全透明
 */
export const CinematicTodayView: React.FC<CinematicTodayViewProps> = ({
  sim,
  deviceSize,
  reduceMotion = false,
  onStartWorkout,
  onOpenArchive,
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

  const [showSetupSheet, setShowSetupSheet] = useState(false);

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[32px]' : 'pt-[50px]';
  const bottomScrollPad = isSE ? 'pb-24' : 'pb-28';
  const heroHeightClass = isSE ? 'h-[430px]' : deviceSize === 'standard' ? 'h-[510px]' : 'h-[545px]';

  const posterMeta = CINEMA_POSTER_BY_PLAN[plan.id] ?? CINEMA_POSTER_BY_PLAN['strength-a'];

  return (
    <div className="relative flex h-full flex-col bg-[#0B0908] text-[#F4EFE6]">
      {/* 顶部极简浮动顶栏（透明悬浮于 Hero 暗角之上，无厚重背景条） */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 ${topSafePad} px-5 pb-4 bg-gradient-to-b from-[#0B0908]/82 via-[#0B0908]/36 to-transparent flex items-center justify-between gap-3`}
      >
        <div className="pointer-events-auto flex items-baseline gap-2.5 min-w-0">
          <span className="font-display-a text-[22px] font-bold tracking-[0.04em] text-[#F4EFE6] leading-none">
            跟练
          </span>
          <span className="text-[11.5px] text-[#A89F94] truncate">
            第 9 周 · 居家哑铃周期
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowSetupSheet(true)}
          className="pointer-events-auto min-h-[38px] px-3 rounded-lg bg-[#0B0908]/45 backdrop-blur-md border border-[#F4EFE6]/14 text-[12px] font-medium text-[#F4EFE6] hover:bg-[#1D1916]/80 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#D9BE94]" />
          <span>配重 / 换片</span>
        </button>
      </div>

      {/* 主体：可沉浸滚动的影院画布 */}
      <div className={`iphone-scroll flex-1 overflow-y-auto ${bottomScrollPad}`}>
        {/* 1. 全幅电影海报式 Hero */}
        <section className={`relative w-full ${heroHeightClass} overflow-hidden bg-[#14110F]`}>
          <AnimatePresence mode="wait">
            <motion.img
              key={posterMeta.heroPosterUrl}
              src={posterMeta.heroPosterUrl}
              alt={plan.title}
              referrerPolicy="no-referrer"
              initial={reduceMotion ? false : { opacity: 0.45, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0.3 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </AnimatePresence>

          {/* 层次化暖黑影院渐变暗角：保住主体轮廓，下方文字高对比可读 */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(11,9,8,0.52) 0%, rgba(11,9,8,0.08) 34%, rgba(11,9,8,0.62) 64%, rgba(11,9,8,0.96) 89%, #0B0908 100%)',
            }}
          />

          {/* Hero 底部海报排版区 */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5">
            {postponedNote ? (
              <div className="rounded-xl bg-[#14110F]/92 border border-[#F4EFE6]/12 p-4 backdrop-blur-md">
                <div className="text-[11.5px] font-medium text-[#D9BE94]">
                  今日顺延 · 保留弹性恢复余量
                </div>
                <h1 className="font-display-a mt-1 text-[26px] font-bold tracking-tight text-[#F4EFE6]">
                  暂缓「{plan.title}」
                </h1>
                <p className="mt-1 text-[12.5px] text-[#A89F94] leading-relaxed">
                  恢复也是周期的一部分，顺延不扣除任何完成记录。也可以随时切换为 15 分钟无器械恢复篇章。
                </p>
                <div className="mt-3.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPostponedNote(false)}
                    className="flex-1 h-11 rounded-xl bg-[#F4EFE6] text-[#0B0908] text-[13.5px] font-bold cursor-pointer"
                  >
                    恢复今日训练
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPlan(3)}
                    className="h-11 px-4 rounded-xl bg-[#F4EFE6]/12 text-[#F4EFE6] text-[13px] font-medium cursor-pointer"
                  >
                    改做恢复日
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[11.5px] font-medium text-[#D9BE94]">
                  <span>今日精选</span>
                  <span aria-hidden="true" className="text-[#F4EFE6]/30">·</span>
                  <span>{plan.category}</span>
                  <span aria-hidden="true" className="text-[#F4EFE6]/30">·</span>
                  <span className="text-[#D8D0C5]">{posterMeta.filmKicker}</span>
                </div>

                <h1
                  className={`font-display-a mt-1.5 font-bold tracking-[-0.01em] text-[#F4EFE6] leading-[1.06] text-balance ${
                    isSE ? 'text-[28px]' : 'text-[34px]'
                  }`}
                >
                  {plan.title}
                </h1>

                <p className="mt-1.5 text-[12.5px] text-[#C8C0B5] leading-relaxed line-clamp-2 max-w-[330px]">
                  {posterMeta.moodLine}
                </p>

                {/* 纯净技术规格行（无胶囊边框） */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono-num text-[11.5px] text-[#A89F94]">
                  <span className="text-[#F4EFE6]/90">{plan.estimatedMinutesRange}</span>
                  <span aria-hidden="true">·</span>
                  <span>{plan.rounds} 轮 × {plan.exercises.length} 动作</span>
                  <span aria-hidden="true">·</span>
                  <span>歇 {customRestSeconds}s</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#D9BE94]">
                    {activePlate ? activePlate.shortLabel : '徒手无负重'}
                  </span>
                </div>

                {/* 主次动作按钮组：暖象牙白主播放键 + 烟熏玻璃次级键 */}
                <div className="mt-4 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onStartWorkout}
                    className="flex-1 h-[50px] rounded-xl bg-[#F4EFE6] text-[#0B0908] text-[14.5px] font-bold flex items-center justify-center gap-2 hover:bg-white active:scale-[0.985] transition-all cursor-pointer shadow-[0_10px_30px_-8px_rgba(0,0,0,0.7)]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>开始今日训练</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSetupSheet(true)}
                    className="h-[50px] px-4 rounded-xl bg-[#F4EFE6]/12 backdrop-blur-md border border-[#F4EFE6]/16 text-[#F4EFE6] text-[13px] font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-[#F4EFE6]/18 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#D9BE94]" />
                    <span>配重参数</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 2. 切换训练片单（横滑 16:9 宽银幕片单卡） */}
        <section className="mt-3 px-5">
          <div className="flex items-baseline justify-between mb-2.5">
            <h2 className="text-[13px] font-semibold text-[#F4EFE6] tracking-wide">
              切换训练篇章
            </h2>
            <button
              type="button"
              onClick={onOpenArchive}
              className="text-[11.5px] text-[#A89F94] hover:text-[#F4EFE6] flex items-center gap-0.5 cursor-pointer"
            >
              <span>历史档案</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto iphone-scroll pb-1 -mx-5 px-5 snap-x snap-mandatory">
            {WORKOUT_OPTIONS.map((opt, idx) => {
              const selected = idx === planIndex && !postponedNote;
              const optMedia =
                CINEMA_POSTER_BY_PLAN[opt.id] ?? CINEMA_POSTER_BY_PLAN['strength-a'];

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectPlan(idx)}
                  className="snap-start shrink-0 w-[164px] text-left group cursor-pointer"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#14110F]">
                    <img
                      src={optMedia.widescreenStillUrl}
                      alt={opt.title}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full object-cover transition-all duration-300 ${
                        selected
                          ? 'scale-[1.02] brightness-100'
                          : 'brightness-[0.68] group-hover:brightness-90'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0908]/85 via-transparent to-transparent" />
                    <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10.5px] font-mono-num">
                      <span className={selected ? 'text-[#D9BE94] font-semibold' : 'text-[#F4EFE6]/85'}>
                        {opt.category}
                      </span>
                      <span className="text-[#A89F94]">{opt.rounds} 轮</span>
                    </div>
                    {/* 极细赤陶红选中底线 */}
                    {selected && (
                      <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-[#BA4832]" />
                    )}
                  </div>
                  <div
                    className={`mt-1.5 text-[12.5px] font-semibold truncate transition-colors ${
                      selected ? 'text-[#F4EFE6]' : 'text-[#A89F94] group-hover:text-[#F4EFE6]'
                    }`}
                  >
                    {opt.title}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. 本集动作分镜表（像剧集分章一样展示动作细节，动作示范一目了然） */}
        <section className="mt-7 px-5">
          <div className="flex items-baseline justify-between pb-2.5 border-b border-[#F4EFE6]/10">
            <h2 className="text-[13px] font-semibold text-[#F4EFE6]">
              单轮动作分镜 · 共 {plan.exercises.length} 幕
            </h2>
            <span className="font-mono-num text-[11px] text-[#A89F94]">
              轮间休息 {customRoundRestSeconds}s
            </span>
          </div>

          <div className="divide-y divide-[#F4EFE6]/8">
            {plan.exercises.map((ex, idx) => (
              <div
                key={ex.id}
                className="py-3.5 flex items-center gap-3.5"
              >
                {/* 16:9 动作分镜缩略图 */}
                <div className="relative w-[112px] aspect-[16/9] shrink-0 overflow-hidden rounded-lg bg-[#14110F]">
                  <img
                    src={ex.imageUrl}
                    alt={ex.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0908]/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1.5 font-mono-num text-[10px] font-semibold text-[#D9BE94]">
                    0{idx + 1}
                  </span>
                </div>

                {/* 动作与配重信息 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[14.5px] font-semibold text-[#F4EFE6] truncate">
                      {ex.name}
                    </h3>
                    <span className="font-mono-num text-[12.5px] font-bold text-[#D9BE94] shrink-0">
                      {ex.targetReps} {ex.unit}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#A89F94] truncate">
                    {ex.targetMuscle}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 font-mono-num text-[11px] text-[#70685F]">
                    <span className="text-[#C8C0B5]">
                      {getExerciseWeightLabel(ex.usesDumbbells)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>节奏 {ex.tempo}</span>
                    {ex.isUnilateral && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#D9BE94]">左右双侧</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 塑料哑铃安全诚实注脚（保留真实安全约束，不堆弹窗警告墙） */}
          <div className="mt-3 pt-3 border-t border-[#F4EFE6]/8 flex items-start gap-2 text-[11.5px] text-[#A89F94] leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 text-[#D88A38] shrink-0 mt-0.5" />
            <span>{USER_CONTEXT.safetyDisclaimer}</span>
          </div>
        </section>
      </div>

      {/* 底部制作参数抽屉（配重片组合 + 休息节奏 + 主动顺延，避免首屏文字堆砌） */}
      {showSetupSheet && (
        <div className="absolute inset-0 z-40 bg-[#0B0908]/78 backdrop-blur-sm flex flex-col justify-end">
          <div
            className={`rounded-t-3xl bg-[#14110F] border-t border-[#F4EFE6]/12 max-h-[84%] flex flex-col ${
              isSE ? 'pb-5' : 'pb-8'
            }`}
          >
            <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-[#F4EFE6]/20 shrink-0" />
            <div className="px-5 pb-3 border-b border-[#F4EFE6]/8 flex items-center justify-between shrink-0">
              <div>
                <div className="text-[11px] text-[#D9BE94]">本场训练设定</div>
                <div className="text-[16px] font-bold text-[#F4EFE6]">配重片组合与休息节奏</div>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupSheet(false)}
                aria-label="关闭设定"
                className="h-9 w-9 rounded-full bg-[#F4EFE6]/8 flex items-center justify-center text-[#A89F94] hover:text-[#F4EFE6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="iphone-scroll flex-1 overflow-y-auto px-5 pt-4 space-y-5">
              {/* 哑铃配重片真实组合 */}
              {plan.defaultPlateId !== null ? (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[13px] font-semibold text-[#F4EFE6]">
                      哑铃配重片（单只装片）
                    </span>
                    <span className="text-[11px] text-[#A89F94]">
                      杆重与承重上限待确认
                    </span>
                  </div>

                  {activePlate && (
                    <div className="rounded-xl bg-[#1D1916] p-3.5 mb-2.5">
                      <div className="text-[13px] font-semibold text-[#F4EFE6]">
                        {activePlate.detailLabel}
                      </div>
                      <div className="mt-1 font-mono-num text-[11.5px] text-[#A89F94]">
                        {activePlate.inventoryUsage}
                      </div>
                      {activePlate.cautionNote && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[#D88A38]">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{activePlate.cautionNote}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5">
                    {PLATE_PRESETS.map((preset) => {
                      const active = activePlate?.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => selectPlatePreset(preset)}
                          className={`min-h-[42px] px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#F4EFE6] text-[#0B0908]'
                              : 'bg-[#1D1916] text-[#C8C0B5] hover:bg-[#26211D]'
                          }`}
                        >
                          <div className="font-mono-num text-[12px] font-bold flex items-center justify-between">
                            <span>
                              {preset.plateSumPerDumbbellKg === 0
                                ? '仅空杆'
                                : `片重 ${preset.plateSumPerDumbbellKg} kg`}
                            </span>
                            {active && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </div>
                          <div
                            className={`text-[10.5px] truncate ${
                              active ? 'text-[#4A433B]' : 'text-[#70685F]'
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
                <div className="rounded-xl bg-[#1D1916] p-3.5 text-[12.5px] text-[#A89F94]">
                  当前为纯徒手「恢复日」，无需装配哑铃。
                </div>
              )}

              {/* 休息节奏设定 */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[13px] font-semibold text-[#F4EFE6]">组间休息倒计时</span>
                  <span className="font-mono-num text-[11.5px] text-[#D9BE94]">
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
                      className={`h-10 rounded-xl font-mono-num text-[12.5px] font-semibold cursor-pointer transition-colors ${
                        customRestSeconds === sec
                          ? 'bg-[#BA4832] text-[#F4EFE6]'
                          : 'bg-[#1D1916] text-[#A89F94] hover:text-[#F4EFE6]'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setRestAutoAdvance(!restAutoAdvance)}
                  className="mt-2.5 w-full min-h-[44px] px-3.5 rounded-xl bg-[#1D1916] flex items-center justify-between text-[12.5px] cursor-pointer"
                >
                  <span className="text-[#C8C0B5]">休息结束后自动进入下一动作</span>
                  <span className="font-semibold text-[#D9BE94]">
                    {restAutoAdvance ? '自动切换' : '手动确认'}
                  </span>
                </button>
              </div>

              {/* 弹性顺延选项 */}
              <div className="pt-2 border-t border-[#F4EFE6]/8 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPostponedNote(true);
                    setShowSetupSheet(false);
                  }}
                  className="min-h-[42px] px-3.5 rounded-xl bg-[#1D1916] text-[12.5px] text-[#A89F94] hover:text-[#F4EFE6] cursor-pointer"
                >
                  今天状态欠佳 · 主动顺延
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSetupSheet(false);
                    onStartWorkout();
                  }}
                  className="flex-1 h-[44px] rounded-xl bg-[#F4EFE6] text-[#0B0908] text-[13.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Film className="w-4 h-4" />
                  <span>保存并开练</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
