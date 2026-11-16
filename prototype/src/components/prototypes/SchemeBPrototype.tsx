import React from 'react';
import {
  AlertCircle,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { USER_CONTEXT, WORKOUT_OPTIONS } from '../../data/workouts';
import { formatTimeMMSS, useWorkoutSimulator } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';
import { SchemeBStageV15 } from './SchemeBStageV15';

interface SchemeBPrototypeProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
}

export const SchemeBPrototype: React.FC<SchemeBPrototypeProps> = ({
  sim,
  deviceSize,
}) => {
  const {
    phase,
    plan,
    planIndex,
    selectPlan,
    activePlate,
    PLATE_PRESETS,
    selectPlatePreset,
    showSwapDrawer,
    setShowSwapDrawer,
    postponedNote,
    setPostponedNote,
    customRestSeconds,
    setCustomRestSeconds,
    customRoundRestSeconds,
    setCustomRoundRestSeconds,
    restAutoAdvance,
    setRestAutoAdvance,
    elapsedSeconds,
    pausedSeconds,
    loggedSets,
    skippedRecords,
    sessionOutcome,
    sessionStartedAt,
    sessionEndedAt,
    startPreparation,
  } = sim;

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[54px]';
  const bottomSafePad = isSE ? 'pb-5' : 'pb-8';

  const totalSetsPerSession =
    plan.rounds *
    plan.exercises.reduce((sum, ex) => sum + (ex.isUnilateral ? 2 : 1), 0);

  // 1. 今日训练
  if (phase === 'today') {
    return (
      <div className="relative flex h-full flex-col bg-[#111315] text-[#EAE7DC]">
        <div className={`${topSafePad} px-5 pb-3 flex items-center justify-between shrink-0`}>
          <div className="text-[13px] font-medium text-[#9A9D9E]">周六 · 弹性训练安排</div>
          <button
            type="button"
            onClick={() => setShowSwapDrawer(true)}
            className="min-h-[40px] px-2 flex items-center gap-1.5 text-[13px] font-medium text-[#EAE7DC] hover:text-[#C8F542] transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>更换 / 顺延</span>
          </button>
        </div>

        <div className="px-5 pb-3.5 flex items-center gap-2 overflow-x-auto iphone-scroll shrink-0">
          {WORKOUT_OPTIONS.map((opt, idx) => {
            const active = planIndex === idx && !postponedNote;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => selectPlan(idx)}
                className={`min-h-[38px] px-3.5 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#C8F542] text-[#111315]'
                    : 'bg-[#1A1D21] text-[#A2A6A8] hover:text-[#EAE7DC]'
                }`}
              >
                {opt.category}
              </button>
            );
          })}
        </div>

        <div className="iphone-scroll flex-1 overflow-y-auto pb-5">
          {postponedNote ? (
            <div className="mx-5 mt-3 rounded-2xl bg-[#1A1D21] p-6">
              <div className="text-[13px] font-semibold text-[#C8F542]">弹性计划已调整</div>
              <h2 className="font-display-b mt-2 text-[26px] font-bold leading-tight text-white">
                今天顺延，留出恢复空间
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-[#A2A6A8]">
                恢复也是训练周期的正常部分。已顺延「{plan.title}」，你也可以随时切换为无器械「恢复日」。
              </p>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setPostponedNote(false)}
                  className="flex-1 h-12 rounded-xl bg-[#C8F542] text-[#111315] text-[14px] font-bold"
                >
                  恢复今日训练
                </button>
                <button
                  type="button"
                  onClick={() => selectPlan(3)}
                  className="px-4 h-12 rounded-xl bg-[#252A30] text-[#EAE7DC] text-[14px] font-medium"
                >
                  改做恢复日
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`relative mx-5 rounded-3xl overflow-hidden bg-[#1A1D21] ${
                  isSE ? 'h-[164px]' : 'h-[192px]'
                }`}
              >
                <img
                  src={plan.exercises[0].imageUrl}
                  alt={plan.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111315] via-[#111315]/55 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-[12px] font-medium text-[#C8F542]">
                    {plan.scheduleContext}
                  </div>
                  <h1 className="font-display-b mt-1 text-[25px] font-extrabold leading-[1.15] text-white">
                    {plan.title}
                  </h1>
                  <div className="mt-1.5 flex items-center gap-2 text-[13px] text-[#D4D2C8] font-mono-num">
                    <span>{plan.estimatedMinutesRange}</span>
                    <span aria-hidden="true">·</span>
                    <span>{plan.rounds} 轮</span>
                    <span aria-hidden="true">·</span>
                    <span>{plan.exercises.length} 动作/轮</span>
                  </div>
                </div>
              </div>

              {activePlate ? (
                <div className="mx-5 mt-5 pb-4 border-b border-[#22262B]">
                  <div className="flex items-center justify-between text-[13px] mb-2">
                    <span className="font-semibold text-[#EAE7DC]">哑铃配重设定（待确认示例）</span>
                    <span className="font-mono-num text-[12px] text-[#9A9D9E]">库存总片重 29kg</span>
                  </div>

                  <div className="rounded-2xl bg-[#181B1F] px-3.5 py-3 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="text-[#9A9D9E] shrink-0">单只装片</span>
                      <span className="font-semibold text-white text-right">
                        {activePlate.platesPerSideKg.length > 0
                          ? `每侧 ${activePlate.platesPerSideKg.join('+')} kg（片重 ${activePlate.plateSumPerDumbbellKg} kg + 未知杆）`
                          : '仅空杆 + 锁扣（未装片）'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 text-[12px]">
                      <span className="text-[#9A9D9E] shrink-0">库存占用</span>
                      <span className="font-mono-num text-[#D4D2C8] text-right">
                        {activePlate.inventoryUsage}
                      </span>
                    </div>
                    {activePlate.cautionNote && (
                      <div className="text-[11.5px] text-[#E3A05B] pt-0.5">
                        提示：{activePlate.cautionNote}
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-start gap-2 text-[11.5px] text-[#E3A05B] leading-snug">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{USER_CONTEXT.safetyDisclaimer}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 overflow-x-auto iphone-scroll pb-1">
                    {PLATE_PRESETS.map((preset) => {
                      const isSel = preset.id === activePlate.id;
                      const isHigh = preset.plateSumPerDumbbellKg >= 11.5;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => selectPlatePreset(preset)}
                          className={`min-h-[36px] px-3 py-1.5 rounded-xl text-[12px] font-mono-num font-semibold whitespace-nowrap shrink-0 transition-colors ${
                            isSel
                              ? isHigh
                                ? 'bg-[#362417] text-[#E3A05B] ring-1 ring-[#E3A05B]/70'
                                : 'bg-[#262C20] text-[#C8F542] ring-1 ring-[#C8F542]/60'
                              : 'bg-[#1A1D21] text-[#A2A6A8] hover:text-white'
                          }`}
                        >
                          {preset.plateSumPerDumbbellKg === 0
                            ? '仅空杆'
                            : `${preset.plateSumPerDumbbellKg}kg片`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mx-5 mt-5 pb-4 border-b border-[#22262B]">
                  <div className="text-[12px] text-[#9A9D9E]">器械要求</div>
                  <div className="mt-1 text-[14px] font-semibold text-white">
                    徒手无器械 · 仅需瑜伽垫
                  </div>
                </div>
              )}

              <div className="mx-5 mt-4 pb-4 border-b border-[#22262B]">
                <div className="flex items-center justify-between text-[13px] mb-2.5">
                  <span className="font-semibold text-[#EAE7DC]">休息节奏设定</span>
                  <span className="font-mono-num text-[12px] text-[#C8F542]">
                    动作间 {customRestSeconds}s · 轮间 {customRoundRestSeconds}s
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[30, 60, 90, 120].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setCustomRestSeconds(sec);
                        setCustomRoundRestSeconds(sec + 30);
                      }}
                      className={`min-h-[36px] rounded-xl font-mono-num text-[12px] font-semibold transition-colors ${
                        customRestSeconds === sec
                          ? 'bg-[#EAE7DC] text-[#111315]'
                          : 'bg-[#1A1D21] text-[#A2A6A8] hover:text-white'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-[#9A9D9E]">倒计时结束后</span>
                  <button
                    type="button"
                    onClick={() => setRestAutoAdvance(!restAutoAdvance)}
                    className="min-h-[34px] px-3 rounded-xl bg-[#1A1D21] text-[#EAE7DC] font-medium hover:text-[#C8F542] transition-colors"
                  >
                    {restAutoAdvance ? '自动进入下一动作' : '等待手动确认开始'}
                  </button>
                </div>
              </div>

              <div className="px-5 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-[#EAE7DC]">
                    单轮循环顺序（{plan.exercises.length} 动作）
                  </span>
                  <span className="font-mono-num text-[12px] text-[#9A9D9E]">
                    共 {plan.rounds} 轮 · {totalSetsPerSession} 组
                  </span>
                </div>

                <div className="divide-y divide-[#1E2227]">
                  {plan.exercises.map((ex, idx) => (
                    <div key={ex.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="flex items-baseline gap-3 min-w-0">
                        <span className="font-mono-num text-[13px] font-bold text-[#C8F542] shrink-0">
                          0{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[15px] font-semibold text-white truncate">
                            {ex.name}
                          </div>
                          <div className="mt-0.5 text-[12px] text-[#9A9D9E] truncate">
                            {ex.muscleGroup} · {ex.targetMuscle} · 节奏 {ex.tempo}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#7D8185] truncate">
                            {ex.isUnilateral ? '单臂左右各 1 组 · ' : ''}
                            {ex.videoUrl ? '含示范视频' : '静态姿态参考（视频待补充）'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pt-0.5">
                        <div className="font-mono-num text-[14px] font-semibold text-[#EAE7DC]">
                          {ex.targetReps} {ex.unit}
                        </div>
                        <div className="text-[11.5px] font-mono-num text-[#9A9D9E] mt-0.5">
                          {ex.usesDumbbells
                            ? activePlate
                              ? `${activePlate.plateSumPerDumbbellKg}kg片`
                              : '空杆'
                            : '徒手'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 独立底部非遮挡操作区：确保动作列表滚到底部时 04 项完整露出不被按钮遮挡 */}
        {!postponedNote && (
          <div className={`relative shrink-0 bg-[#111315] border-t border-[#1E2227] px-5 pt-3.5 ${bottomSafePad}`}>
            <div className="pointer-events-none absolute -top-5 left-0 right-0 h-5 bg-gradient-to-t from-[#111315] to-transparent" />
            <button
              type="button"
              onClick={startPreparation}
              className="w-full h-[54px] rounded-2xl bg-[#C8F542] text-[#111315] text-[16px] font-extrabold tracking-tight flex items-center justify-center gap-2 active:scale-[0.985] transition-transform"
            >
              <span>开始今日跟练</span>
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        )}

        {showSwapDrawer && (
          <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-xs flex flex-col justify-end">
            <div className={`rounded-t-3xl bg-[#1A1D21] p-5 ${bottomSafePad}`}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#3A4047]" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[16px] font-bold text-white">调整今日训练</span>
                <button
                  type="button"
                  onClick={() => setShowSwapDrawer(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#9A9D9E]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {WORKOUT_OPTIONS.map((opt, idx) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectPlan(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl flex items-center justify-between transition-colors ${
                      planIndex === idx
                        ? 'bg-[#C8F542] text-[#111315]'
                        : 'bg-[#111315] text-[#EAE7DC]'
                    }`}
                  >
                    <div>
                      <div className="text-[14px] font-bold">
                        {opt.category} · {opt.title}
                      </div>
                      <div
                        className={`text-[12px] mt-0.5 ${
                          planIndex === idx ? 'text-[#232B09]' : 'text-[#9A9D9E]'
                        }`}
                      >
                        {opt.estimatedMinutesRange} · 默认休息 {opt.defaultRestSeconds}s
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPostponedNote(true);
                  setShowSwapDrawer(false);
                }}
                className="mt-3 w-full h-12 rounded-2xl bg-[#252A30] text-[14px] font-semibold text-[#EAE7DC]"
              >
                今天状态一般，顺延至下次
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 7. 训练总结（真实实录驱动，严格区分完整完成 / 部分完成 / 0组提前结束）
  if (phase === 'summary') {
    const isCompleted = sessionOutcome === 'completed';
    const isZeroExit = sessionOutcome === 'early_exit_zero';
    const totalActualReps = loggedSets.reduce((sum, s) => sum + s.actualReps, 0);

    return (
      <div className="relative flex h-full flex-col bg-[#111315] text-[#EAE7DC]">
        <div className={`iphone-scroll flex-1 overflow-y-auto px-5 pb-28 ${topSafePad}`}>
          <div
            className={`text-[13px] font-semibold ${
              isCompleted
                ? 'text-[#C8F542]'
                : isZeroExit
                ? 'text-[#E3A05B]'
                : 'text-[#EAE7DC]'
            }`}
          >
            {isCompleted
              ? '本次训练完整完成'
              : isZeroExit
              ? '提前结束（完成 0 组）'
              : '提前结束（部分完成）'}
          </div>
          <h1 className="font-display-b mt-1 text-[28px] font-extrabold leading-tight text-white">
            {isCompleted
              ? '按计划完成全部轮次'
              : isZeroExit
              ? '未计入完整课程完成次数'
              : '已保存实录，不影响后续弹性安排'}
          </h1>
          <p className="mt-1.5 text-[12px] text-[#9A9D9E]">
            起止 {sessionStartedAt || '--:--:--'} → {sessionEndedAt || '--:--:--'} · 暂停累计{' '}
            {pausedSeconds}s
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 py-4 border-y border-[#22262B]">
            <div>
              <div className="font-mono-num text-[24px] font-extrabold text-white">
                {loggedSets.length}
              </div>
              <div className="text-[11px] text-[#9A9D9E] mt-0.5">实录完成组</div>
            </div>
            <div>
              <div className="font-mono-num text-[24px] font-extrabold text-white">
                {totalActualReps}
              </div>
              <div className="text-[11px] text-[#9A9D9E] mt-0.5">实录总次数/秒</div>
            </div>
            <div>
              <div className="font-mono-num text-[24px] font-extrabold text-[#C8F542]">
                {formatTimeMMSS(elapsedSeconds)}
              </div>
              <div className="text-[11px] text-[#9A9D9E] mt-0.5">有效训练时长</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[13px] font-semibold text-white mb-2">
              逐组实录明细（{loggedSets.length} 组）
            </div>
            {loggedSets.length === 0 ? (
              <div className="rounded-2xl bg-[#1A1D21] p-4 text-[13px] text-[#9A9D9E] leading-relaxed">
                本次尚未记录任何完成组，系统不会伪造训练数据，也不会计入完整课程完成次数。
              </div>
            ) : (
              <div className="divide-y divide-[#1E2227]">
                {loggedSets.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-2 text-[12px]">
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">
                        R{item.round} · {item.exerciseName}
                        {item.side === 'left' ? '（左）' : item.side === 'right' ? '（右）' : ''}
                      </div>
                      <div className="text-[#9A9D9E] font-mono-num mt-0.5">
                        {item.weightUsed} · 休息 {item.actualRestSeconds}s · {item.startedAt}-{item.endedAt}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono-num font-bold text-[#C8F542]">
                        {item.actualReps}/{item.targetReps} {item.unit}
                      </div>
                      <div className="text-[#9A9D9E]">{item.effort}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {skippedRecords.length > 0 && (
            <div className="mt-5">
              <div className="text-[13px] font-semibold text-[#E3A05B] mb-2">
                跳过动作记录（{skippedRecords.length} 项 · 未计为完成）
              </div>
              <div className="space-y-1.5">
                {skippedRecords.map((sk, idx) => (
                  <div
                    key={`${sk.timestamp}-${idx}`}
                    className="rounded-xl bg-[#1A1D21] px-3 py-2 text-[12px] text-[#A2A6A8] flex items-center justify-between"
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

        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#111315] via-[#111315] to-transparent px-5 pt-4 ${bottomSafePad}`}
        >
          <button
            type="button"
            onClick={() => selectPlan(planIndex)}
            className="w-full h-[52px] rounded-2xl bg-[#C8F542] text-[#111315] text-[15px] font-extrabold"
          >
            完成并回到今日训练
          </button>
        </div>
      </div>
    );
  }

  // 2, 3, 4, 5, 6 统一 B1.5 沉浸式运动舞台
  return <SchemeBStageV15 sim={sim} deviceSize={deviceSize} />;
};
