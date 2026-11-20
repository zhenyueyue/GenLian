import React, { useEffect, useRef, useState } from 'react';
import { WORKOUT_OPTIONS } from '../data/workouts';
import { useWorkoutSimulator } from '../hooks/useWorkoutSimulator';
import { DeviceSize } from '../types/design';
import { PolishedScreen } from './cinematic-polished/polishedMedia';
import { IPhoneFrame } from './IPhoneFrame';
import { MoodAppShell } from './mood-explorations/MoodAppShell';
import { MOOD_THEMES, MoodId } from './mood-explorations/moodThemes';
import { MoodJumpTarget } from './MoodComparisonWorkspace';
import { WarmAppShell } from './warm-performance/WarmAppShell';
import {
  getWarmStatusBarTone,
  WARM_COMPONENT_SPECS,
  WARM_PALETTE_SPEC,
  WARM_TOKENS,
  WARM_TYPE_SCALE,
} from './warm-performance/warmTokens';

interface WarmPerformanceWorkspaceProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
  activeScreen: PolishedScreen;
  onChangeScreen: (screen: PolishedScreen) => void;
  selectedHistoryId: string | null;
  onSelectHistoryId: (id: string | null) => void;
  inspectedExerciseIdx: number | null;
  onInspectExerciseIdx: (idx: number | null) => void;
  onJumpScene: (target: MoodJumpTarget) => void;
}

type WorkspaceViewTab = 'dual_course' | 'focus' | 'daylight' | 'airy';

const CORE_FIVE_SCENES: { id: MoodJumpTarget; label: string }[] = [
  { id: 'today', label: '1. 今日首页' },
  { id: 'active', label: '2. 动作进行中' },
  { id: 'rest', label: '3. 组间 / 训练间歇' },
  { id: 'history', label: '4. 训练档案' },
  { id: 'history_detail', label: '5. 单次训练详情' },
];

const EXTRA_SCENES: { id: MoodJumpTarget; label: string }[] = [
  { id: 'detail', label: '连续动作详情' },
  { id: 'summary', label: '训练总结页' },
];

const COURSE_SHORTCUTS = [
  { idx: 0, label: '力量 A · 全身循环' },
  { idx: 2, label: '有氧 · 代谢循环' },
  { idx: 3, label: '恢复日 · 舒展' },
  { idx: 1, label: '力量 B · 肩背后链' },
];

export const WarmPerformanceWorkspace: React.FC<WarmPerformanceWorkspaceProps> = ({
  sim,
  deviceSize,
  reduceMotion = false,
  activeScreen,
  onChangeScreen,
  selectedHistoryId,
  onSelectHistoryId,
  inspectedExerciseIdx,
  onInspectExerciseIdx,
  onJumpScene,
}) => {
  const [viewTab, setViewTab] = useState<WorkspaceViewTab>('dual_course');

  // 独立的有氧课程模拟器，与主模拟器（默认力量 A）同频验证产品一致性
  const cardioSim = useWorkoutSimulator('today', 2);
  const [cardioScreen, setCardioScreen] = useState<PolishedScreen>(activeScreen);
  const [cardioHistoryId, setCardioHistoryId] = useState<string | null>(selectedHistoryId);
  const [cardioInspectIdx, setCardioInspectIdx] = useState<number | null>(inspectedExerciseIdx);

  // 当顶部 App Header 快捷栏切换场景或测试视频流开关变动时，同步有氧端展示态
  const prevTopSyncRef = useRef({
    phase: sim.phase,
    isDebug: sim.isDebugPreviewMode,
    screen: activeScreen,
    historyId: selectedHistoryId,
    inspectIdx: inspectedExerciseIdx,
    useTestVideo: sim.useTestVideoStream,
  });

  useEffect(() => {
    const prev = prevTopSyncRef.current;
    if (prev.useTestVideo !== sim.useTestVideoStream) {
      cardioSim.setUseTestVideoStream(sim.useTestVideoStream);
    }

    const phaseChangedByInspect =
      prev.phase !== sim.phase && (sim.isDebugPreviewMode || sim.phase === 'today');
    const navChanged =
      prev.screen !== activeScreen ||
      prev.historyId !== selectedHistoryId ||
      prev.inspectIdx !== inspectedExerciseIdx;

    if (viewTab === 'dual_course' && (phaseChangedByInspect || navChanged)) {
      if (sim.phase !== cardioSim.phase && (sim.isDebugPreviewMode || sim.phase === 'today')) {
        cardioSim.jumpToInspectPhase(sim.phase);
      }
      setCardioScreen(activeScreen);
      setCardioHistoryId(selectedHistoryId);
      setCardioInspectIdx(inspectedExerciseIdx);
    }

    prevTopSyncRef.current = {
      phase: sim.phase,
      isDebug: sim.isDebugPreviewMode,
      screen: activeScreen,
      historyId: selectedHistoryId,
      inspectIdx: inspectedExerciseIdx,
      useTestVideo: sim.useTestVideoStream,
    };
  }, [
    viewTab,
    sim.phase,
    sim.isDebugPreviewMode,
    sim.useTestVideoStream,
    activeScreen,
    selectedHistoryId,
    inspectedExerciseIdx,
    cardioSim,
  ]);

  const applyJumpToCardio = (target: MoodJumpTarget) => {
    if (target === 'active') {
      setCardioInspectIdx(null);
      cardioSim.jumpToInspectPhase('active');
      return;
    }
    if (target === 'rest') {
      setCardioInspectIdx(null);
      cardioSim.jumpToInspectPhase('rest');
      return;
    }
    if (target === 'summary') {
      setCardioInspectIdx(null);
      cardioSim.jumpToInspectPhase('summary');
      return;
    }
    if (cardioSim.phase !== 'today') {
      cardioSim.jumpToInspectPhase('today');
    }
    if (target === 'today') {
      setCardioInspectIdx(null);
      setCardioHistoryId(null);
      setCardioScreen('today');
    } else if (target === 'detail') {
      setCardioHistoryId(null);
      setCardioScreen('today');
      setCardioInspectIdx(0);
    } else if (target === 'history') {
      setCardioInspectIdx(null);
      setCardioHistoryId(null);
      setCardioScreen('history');
    } else if (target === 'history_detail') {
      setCardioInspectIdx(null);
      setCardioScreen('history');
      setCardioHistoryId('hist-03');
    }
  };

  const handleWorkspaceJump = (target: MoodJumpTarget) => {
    if (viewTab === 'dual_course') {
      if (sim.planIndex !== 0) {
        sim.selectPlan(0);
      }
      if (cardioSim.planIndex !== 2) {
        cardioSim.selectPlan(2);
      }
      applyJumpToCardio(target);
    }
    onJumpScene(target);
  };

  const handleSelectViewTab = (nextTab: WorkspaceViewTab) => {
    setViewTab(nextTab);
    if (nextTab === 'dual_course') {
      if (sim.planIndex !== 0) {
        sim.selectPlan(0);
      }
      if (cardioSim.planIndex !== 2) {
        cardioSim.selectPlan(2);
      }
      cardioSim.jumpToInspectPhase(sim.phase);
      setCardioScreen(activeScreen);
      setCardioHistoryId(selectedHistoryId);
      setCardioInspectIdx(inspectedExerciseIdx);
    }
  };

  const handleCourseShortcut = (planIdx: number) => {
    setViewTab('focus');
    onInspectExerciseIdx(null);
    onSelectHistoryId(null);
    onChangeScreen('today');
    sim.selectPlan(planIdx);
  };

  const isSceneActive = (id: MoodJumpTarget): boolean => {
    if (id === 'today') {
      return sim.phase === 'today' && activeScreen === 'today' && inspectedExerciseIdx === null;
    }
    if (id === 'detail') {
      return sim.phase === 'today' && activeScreen === 'today' && inspectedExerciseIdx !== null;
    }
    if (id === 'active') return sim.phase === 'active';
    if (id === 'rest') return sim.phase === 'rest';
    if (id === 'summary') return sim.phase === 'summary';
    if (id === 'history') {
      return sim.phase === 'today' && activeScreen === 'history' && selectedHistoryId === null;
    }
    return sim.phase === 'today' && activeScreen === 'history' && selectedHistoryId !== null;
  };

  const warmStatusTone = getWarmStatusBarTone(sim.phase);
  const cardioStatusTone = getWarmStatusBarTone(cardioSim.phase);
  const hasDetail = inspectedExerciseIdx !== null;
  const hasHistoryDetail = selectedHistoryId !== null;

  return (
    <div className="space-y-8">
      {/* 顶部控台：视图模式 + 三类课程验证 + 五核心场景同步跳转 */}
      <section className="rounded-2xl bg-white border border-[#DCD9D0] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E3DC] pb-4">
          <div className="max-w-3xl">
            <div
              className="text-[11px] font-mono-num font-semibold tracking-wider"
              style={{ color: WARM_TOKENS.accentTextOnLight }}
            >
              WARM PERFORMANCE · 暖光运动 · 力量 / 有氧 / 恢复跨课程一致性验证
            </div>
            <h1 className="font-editorial-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#1C1917] mt-1">
              Warm Performance · 暖光运动（纸间改版）
            </h1>
            <p className="mt-1.5 text-sm text-[#44403C] leading-relaxed">
              骨色纸 #F4F1EB、暖墨 #1C1917 与柿色 #C2410C。衬线标题、圆角课程卡和实色底栏在力量、有氧、恢复三课上使用同一套版面。
            </p>
          </div>

          <div className="inline-flex flex-wrap p-1 rounded-xl bg-[#F3F2EE] border border-[#E5E3DC] shrink-0 gap-0.5">
            {(
              [
                { id: 'dual_course', label: '力量 A × 有氧 · 双课验证' },
                { id: 'focus', label: '单机完整规范（含恢复日）' },
                { id: 'daylight', label: '对照方案 1 · 日光' },
                { id: 'airy', label: '对照方案 2 · 清透' },
              ] as { id: WorkspaceViewTab; label: string }[]
            ).map((item) => {
              const active = viewTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectViewTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#1C1917] text-[#F4F1EB]'
                      : 'text-[#44403C] hover:text-[#1C1917]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 课程快速切换条 + 场景跳转 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {CORE_FIVE_SCENES.map((scene) => {
              const active = isSceneActive(scene.id);
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => handleWorkspaceJump(scene.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#C2410C] text-white shadow-sm'
                      : 'bg-[#F3F2EE] text-[#44403C] hover:bg-[#E7E5DC] hover:text-[#1C1917]'
                  }`}
                >
                  {scene.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {EXTRA_SCENES.map((scene) => {
              const active = isSceneActive(scene.id);
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => handleWorkspaceJump(scene.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#1C1917] text-white border-[#1C1917]'
                      : 'bg-white text-[#44403C] border-[#DCD9D0] hover:border-[#1C1917]'
                  }`}
                >
                  {scene.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-[#ECEAE2] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11.5px] font-medium text-[#686F7A] mr-1">切换单机课程：</span>
            {COURSE_SHORTCUTS.map((course) => {
              const isCurrentSingle = viewTab !== 'dual_course' && sim.planIndex === course.idx;
              return (
                <button
                  key={course.idx}
                  type="button"
                  onClick={() => handleCourseShortcut(course.idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isCurrentSingle
                      ? 'bg-[#1C1917] text-[#F4F1EB]'
                      : 'bg-[#F3F2EE] text-[#44403C] hover:text-[#1C1917]'
                  }`}
                >
                  {course.label}
                </button>
              );
            })}
          </div>
          <span className="text-[11.5px] font-mono-num text-[#686F7A]">
            {viewTab === 'dual_course'
              ? '当前并排同步：左机 力量 A · 右机 有氧（上方阶段按钮同步两机）'
              : `当前单机课程：${WORKOUT_OPTIONS[sim.planIndex]?.category} · ${WORKOUT_OPTIONS[sim.planIndex]?.title}`}
          </span>
        </div>
      </section>

      {viewTab === 'dual_course' ? (
        /* 力量 A vs 有氧 双课并排验证舞台 */
        <div className="space-y-8">
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start justify-items-center">
            <div className="flex flex-col items-center w-full">
              <div className="mb-4 text-center max-w-md">
                <div
                  className="text-xs font-semibold tracking-wider"
                  style={{ color: WARM_TOKENS.accentTextOnLight }}
                >
                  COURSE 01 · 力量 A：全身均衡循环
                </div>
                <div className="text-sm font-medium text-[#44403C] mt-0.5">
                  专注肌肉发力控制与稳健节奏 · 90s 组间安静恢复
                </div>
              </div>
              <IPhoneFrame deviceSize={deviceSize} statusBarTone={warmStatusTone}>
                <WarmAppShell
                  sim={sim}
                  deviceSize={deviceSize}
                  reduceMotion={reduceMotion}
                  activeScreen={activeScreen}
                  onChangeScreen={onChangeScreen}
                  selectedHistoryId={selectedHistoryId}
                  onSelectHistoryId={onSelectHistoryId}
                  inspectedExerciseIdx={inspectedExerciseIdx}
                  onInspectExerciseIdx={onInspectExerciseIdx}
                />
              </IPhoneFrame>
            </div>

            <div className="flex flex-col items-center w-full">
              <div className="mb-4 text-center max-w-md">
                <div
                  className="text-xs font-semibold tracking-wider"
                  style={{ color: WARM_TOKENS.accentTextOnLight }}
                >
                  COURSE 02 · 有氧：轻负重代谢循环
                </div>
                <div className="text-sm font-medium text-[#44403C] mt-0.5">
                  鲜明身体动态与 30s 有氧训练间歇 · 零霓虹零游戏化 HUD
                </div>
              </div>
              <IPhoneFrame deviceSize={deviceSize} statusBarTone={cardioStatusTone}>
                <WarmAppShell
                  sim={cardioSim}
                  deviceSize={deviceSize}
                  reduceMotion={reduceMotion}
                  activeScreen={cardioScreen}
                  onChangeScreen={setCardioScreen}
                  selectedHistoryId={cardioHistoryId}
                  onSelectHistoryId={setCardioHistoryId}
                  inspectedExerciseIdx={cardioInspectIdx}
                  onInspectExerciseIdx={setCardioInspectIdx}
                />
              </IPhoneFrame>
            </div>
          </section>

          {/* 跨课程一致性与本轮 4 项细节修复说明 */}
          <section className="bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-[#E5E3DC]">
              <div>
                <div
                  className="text-[11px] font-mono-num font-semibold tracking-wider"
                  style={{ color: WARM_TOKENS.accentTextOnLight }}
                >
                  CONSISTENCY & POLISH AUDIT
                </div>
                <h2 className="text-lg font-semibold text-[#1C1917] mt-0.5">
                  三课视觉一致性与本轮 4 项精确修复
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleCourseShortcut(3)}
                className="text-xs font-semibold text-[#9A3412] hover:underline cursor-pointer"
              >
                切至恢复日核对舒展态 →
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {WARM_COMPONENT_SPECS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: '#FAF9F6',
                    border: '1px solid rgba(25,29,34,0.08)',
                  }}
                >
                  <div className="text-sm font-semibold text-[#1C1917]">{item.title}</div>
                  <p className="mt-1.5 text-xs text-[#44403C] leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : viewTab === 'daylight' || viewTab === 'airy' ? (
        /* 并排对照：正式版 Warm Performance vs 原方案 1 / 方案 2 */
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start justify-items-center">
          <div className="flex flex-col items-center w-full">
            <div className="mb-4 text-center">
              <div
                className="text-xs font-semibold tracking-wider"
                style={{ color: WARM_TOKENS.accentTextOnLight }}
              >
                FORMAL SYSTEM · Warm Performance（暖光运动）
              </div>
              <div className="text-sm font-medium text-[#44403C] mt-0.5">
                #F4F1EB 骨色纸 × #1C1917 暖墨 × #C2410C 柿色
              </div>
            </div>
            <IPhoneFrame deviceSize={deviceSize} statusBarTone={warmStatusTone}>
              <WarmAppShell
                sim={sim}
                deviceSize={deviceSize}
                reduceMotion={reduceMotion}
                activeScreen={activeScreen}
                onChangeScreen={onChangeScreen}
                selectedHistoryId={selectedHistoryId}
                onSelectHistoryId={onSelectHistoryId}
                inspectedExerciseIdx={inspectedExerciseIdx}
                onInspectExerciseIdx={onInspectExerciseIdx}
              />
            </IPhoneFrame>
          </div>

          {(() => {
            const refTheme = MOOD_THEMES[viewTab as MoodId];
            const refTone = refTheme.getStatusBarTone(
              sim.phase,
              activeScreen,
              hasDetail,
              hasHistoryDetail
            );
            return (
              <div className="flex flex-col items-center w-full">
                <div className="mb-4 text-center">
                  <div className="text-xs font-semibold tracking-wider text-[#44403C]">
                    REFERENCE · 方案 {refTheme.code === 'A' ? '1' : '2'} {refTheme.nameZh}（
                    {refTheme.nameEn}）
                  </div>
                  <div className="text-sm font-medium text-[#44403C] mt-0.5">
                    {refTheme.tagline}
                  </div>
                </div>
                <IPhoneFrame deviceSize={deviceSize} statusBarTone={refTone}>
                  <MoodAppShell
                    moodId={viewTab as MoodId}
                    sim={sim}
                    deviceSize={deviceSize}
                    reduceMotion={reduceMotion}
                    activeScreen={activeScreen}
                    onChangeScreen={onChangeScreen}
                    selectedHistoryId={selectedHistoryId}
                    onSelectHistoryId={onSelectHistoryId}
                    inspectedExerciseIdx={inspectedExerciseIdx}
                    onInspectExerciseIdx={onInspectExerciseIdx}
                  />
                </IPhoneFrame>
              </div>
            );
          })()}
        </section>
      ) : (
        /* 单机审阅布局：左侧真机交互原型 + 右侧完整设计系统与组件规范 */
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-24">
            <IPhoneFrame deviceSize={deviceSize} statusBarTone={warmStatusTone}>
              <WarmAppShell
                sim={sim}
                deviceSize={deviceSize}
                reduceMotion={reduceMotion}
                activeScreen={activeScreen}
                onChangeScreen={onChangeScreen}
                selectedHistoryId={selectedHistoryId}
                onSelectHistoryId={onSelectHistoryId}
                inspectedExerciseIdx={inspectedExerciseIdx}
                onInspectExerciseIdx={onInspectExerciseIdx}
              />
            </IPhoneFrame>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {/* 1. 最终品牌色彩规范（60-30-10） */}
            <div className="bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-[#E5E3DC]">
                <div>
                  <div
                    className="text-[11px] font-mono-num font-semibold tracking-wider"
                    style={{ color: WARM_TOKENS.accentTextOnLight }}
                  >
                    01 · COLOR SYSTEM SPEC
                  </div>
                  <h2 className="text-lg font-semibold text-[#1C1917] mt-0.5">
                    最终统一配色规范（60 / 30 / 10）
                  </h2>
                </div>
                <span className="text-xs font-mono-num text-[#686F7A]">
                  单一品牌强调色 · WCAG AA 验证
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {WARM_PALETTE_SPEC.map((swatch) => (
                  <div
                    key={swatch.hex}
                    className="rounded-xl p-3.5 flex items-start gap-3"
                    style={{
                      backgroundColor: '#FAF9F6',
                      border: '1px solid rgba(25,29,34,0.08)',
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-lg shrink-0 border border-black/10"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-[#1C1917]">
                          {swatch.name}
                        </span>
                        <span className="font-mono-num text-xs font-semibold text-[#44403C]">
                          {swatch.hex}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-[#686F7A] mt-0.5">
                        {swatch.role}
                      </div>
                      <p className="text-xs text-[#44403C] leading-relaxed mt-1">
                        {swatch.usage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. 字体层级与数字排版规范 */}
            <div className="bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-[#E5E3DC]">
                <div>
                  <div
                    className="text-[11px] font-mono-num font-semibold tracking-wider"
                    style={{ color: WARM_TOKENS.accentTextOnLight }}
                  >
                    02 · TYPOGRAPHY HIERARCHY
                  </div>
                  <h2 className="text-lg font-semibold text-[#1C1917] mt-0.5">
                    字体层级与数字等宽排版
                  </h2>
                </div>
                <span className="text-xs font-mono-num text-[#686F7A]">
                  Outfit + Plus Jakarta Sans + JetBrains Mono
                </span>
              </div>

              <div className="divide-y divide-[#ECEAE2] mt-2">
                {WARM_TYPE_SCALE.map((row) => (
                  <div
                    key={row.level}
                    className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#1C1917]">{row.level}</div>
                      <div className="text-xs text-[#686F7A] font-mono-num mt-0.5">
                        {row.font} · {row.spec}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[#1C1917] font-display-b tabular-nums bg-[#F4F1EB] px-3 py-1.5 rounded-lg border border-[#E5E3DC]">
                      {row.sample}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 五核心页面与关键组件规范 */}
            <div className="bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-[#E5E3DC]">
                <div>
                  <div
                    className="text-[11px] font-mono-num font-semibold tracking-wider"
                    style={{ color: WARM_TOKENS.accentTextOnLight }}
                  >
                    03 · KEY COMPONENT ARCHITECTURE
                  </div>
                  <h2 className="text-lg font-semibold text-[#1C1917] mt-0.5">
                    关键组件与五核心页面规范
                  </h2>
                </div>
                <span className="text-xs text-[#415A72] font-medium">
                  已就绪：力量 A / 有氧 / 恢复跨课一致
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {WARM_COMPONENT_SPECS.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: '#FAF9F6',
                      border: '1px solid rgba(25,29,34,0.08)',
                    }}
                  >
                    <div className="text-sm font-semibold text-[#1C1917]">{item.title}</div>
                    <p className="mt-1.5 text-xs text-[#44403C] leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-[#ECEAE2] flex flex-wrap items-center justify-between gap-3 text-xs text-[#44403C]">
                <span>
                  三课（力量、有氧、恢复）共用同一套字体、配色、导航与控件交互规范。
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectViewTab('dual_course')}
                  className="font-semibold text-[#9A3412] hover:underline cursor-pointer shrink-0"
                >
                  切回力量 A × 有氧并排验证 →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
