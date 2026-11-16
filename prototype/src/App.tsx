import React, { useState } from 'react';
import { Film, RotateCcw } from 'lucide-react';
import { GenLianAppShell } from './components/app/GenLianAppShell';
import { Phase2ModuleId } from './components/app/TodayOverviewView';
import { CinematicAppShell } from './components/cinematic/CinematicAppShell';
import { CinematicScreen } from './components/cinematic/cinematicMedia';
import { PolishedAppShell } from './components/cinematic-polished/PolishedAppShell';
import { CinematicSpecPanel } from './components/CinematicSpecPanel';
import {
  DesignExplorationPanel,
  WorkspaceViewMode,
} from './components/DesignExplorationPanel';
import { IPhoneFrame } from './components/IPhoneFrame';
import { LiquidGlassA11yConfig } from './components/liquid/LiquidGlassPrimitives';
import { LiquidGlassComparisonPanel } from './components/LiquidGlassComparisonPanel';
import { MoodComparisonWorkspace } from './components/MoodComparisonWorkspace';
import { Phase1SpecPanel } from './components/Phase1SpecPanel';
import { PolishedComparisonPanel } from './components/PolishedComparisonPanel';
import { SchemeBSpecPanel } from './components/SchemeBSpecPanel';
import { SchemeBLiquidGlassPrototype } from './components/prototypes/SchemeBLiquidGlassPrototype';
import { SchemeBPrototype } from './components/prototypes/SchemeBPrototype';
import { SchemeEditorialPrototype } from './components/prototypes/SchemeEditorialPrototype';
import { SchemePrecisionPrototype } from './components/prototypes/SchemePrecisionPrototype';
import { WarmPerformanceWorkspace } from './components/WarmPerformanceWorkspace';
import { MainAppTab } from './data/appRecords';
import { useWorkoutSimulator } from './hooks/useWorkoutSimulator';
import { DeviceSize, WorkoutPhase } from './types/design';

type ExtendedWorkspaceMode =
  | 'warm_performance'
  | 'mood_trio'
  | 'mood_baseline_compare'
  | 'cinematic_polished'
  | 'cinematic_compare'
  | 'cinematic'
  | 'phase1_app'
  | 'lg_compare'
  | 'liquid_glass'
  | WorkspaceViewMode;

const WORKSPACE_MODES: { id: ExtendedWorkspaceMode; label: string }[] = [
  { id: 'warm_performance', label: '正式方案 · Warm Performance 暖光运动' },
  { id: 'mood_trio', label: '原案留存 · 方案 1 / 2 / 3 平行对比' },
  { id: 'mood_baseline_compare', label: '现版暗色 vs 1 / 2 / 3 对照' },
  { id: 'cinematic_polished', label: '现版保留 · Cinematic 暮色精修' },
  { id: 'cinematic_compare', label: '精修前后对照（v1 vs 精修版）' },
  { id: 'cinematic', label: 'Cinematic v1（精修前）' },
  { id: 'phase1_app', label: '旧版保留 · Phase 1 4-Tab' },
  { id: 'lg_compare', label: 'B1.5 原版 vs Liquid Glass' },
  { id: 'baseline', label: 'B1.5 原版基线' },
  { id: 'compare', label: '品牌 A / 精密 B 探索' },
];

export default function App() {
  const sim = useWorkoutSimulator('today');
  const [viewMode, setViewMode] = useState<ExtendedWorkspaceMode>('warm_performance');
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('standard');

  // Cinematic（v1 & 精修版共享对比同步状态）
  const [cinemaScreen, setCinemaScreen] = useState<CinematicScreen>('today');
  const [cinemaHistoryId, setCinemaHistoryId] = useState<string | null>(null);
  const [cinemaInspectIdx, setCinemaInspectIdx] = useState<number | null>(null);

  // 旧版 Phase 1 模式状态
  const [activeTab, setActiveTab] = useState<MainAppTab>('overview');
  const [showTodaySetup, setShowTodaySetup] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [phase2Subpage, setPhase2Subpage] = useState<Phase2ModuleId | null>(null);

  const [a11y, setA11y] = useState<LiquidGlassA11yConfig>({
    reduceTransparency: false,
    increaseContrast: false,
    reduceMotion: false,
  });

  const handleReset = () => {
    sim.selectPlan(0);
    setCinemaScreen('today');
    setCinemaHistoryId(null);
    setCinemaInspectIdx(null);
    setActiveTab('overview');
    setShowTodaySetup(false);
    setSelectedHistoryId(null);
    setPhase2Subpage(null);
  };

  const handleSelectWorkspaceMode = (nextMode: ExtendedWorkspaceMode) => {
    setViewMode(nextMode);
    if ((nextMode === 'lg_compare' || nextMode === 'liquid_glass') && sim.phase === 'today') {
      sim.jumpToInspectPhase('active');
    } else if (
      (nextMode === 'warm_performance' ||
        nextMode === 'mood_trio' ||
        nextMode === 'mood_baseline_compare' ||
        nextMode === 'cinematic_polished' ||
        nextMode === 'cinematic_compare' ||
        nextMode === 'cinematic' ||
        nextMode === 'phase1_app') &&
      sim.isDebugPreviewMode
    ) {
      sim.jumpToInspectPhase('today');
    }
  };

  const handleJumpCinematicScreen = (
    target:
      | 'today'
      | 'detail'
      | 'active'
      | 'next'
      | 'rest'
      | 'summary'
      | 'history'
      | 'history_detail'
  ) => {
    if (target === 'active') {
      setCinemaInspectIdx(null);
      sim.jumpToInspectPhase('active');
      return;
    }
    if (target === 'next') {
      setCinemaInspectIdx(null);
      sim.jumpToInspectPhase('nextTransition');
      return;
    }
    if (target === 'rest') {
      setCinemaInspectIdx(null);
      sim.jumpToInspectPhase('rest');
      return;
    }
    if (target === 'summary') {
      setCinemaInspectIdx(null);
      sim.jumpToInspectPhase('summary');
      return;
    }
    if (sim.phase !== 'today') {
      sim.jumpToInspectPhase('today');
    }
    if (target === 'today') {
      setCinemaInspectIdx(null);
      setCinemaHistoryId(null);
      setCinemaScreen('today');
    } else if (target === 'detail') {
      setCinemaHistoryId(null);
      setCinemaScreen('today');
      setCinemaInspectIdx(0);
    } else if (target === 'history') {
      setCinemaInspectIdx(null);
      setCinemaHistoryId(null);
      setCinemaScreen('history');
    } else if (target === 'history_detail') {
      setCinemaInspectIdx(null);
      setCinemaScreen('history');
      setCinemaHistoryId('hist-01');
    }
  };

  const handleJumpPhase1Screen = (
    screen:
      | 'overview'
      | 'plan'
      | 'history'
      | 'history_detail'
      | 'today_setup'
      | 'active_player'
      | 'phase2_body'
  ) => {
    setPhase2Subpage(null);
    if (screen === 'active_player') {
      setShowTodaySetup(false);
      sim.jumpToInspectPhase('active');
      return;
    }

    if (sim.phase !== 'today') {
      sim.jumpToInspectPhase('today');
    }

    if (screen === 'today_setup') {
      setActiveTab('overview');
      setSelectedHistoryId(null);
      setShowTodaySetup(true);
    } else if (screen === 'overview') {
      setShowTodaySetup(false);
      setSelectedHistoryId(null);
      setActiveTab('overview');
    } else if (screen === 'plan') {
      setShowTodaySetup(false);
      setSelectedHistoryId(null);
      setActiveTab('plan');
    } else if (screen === 'history') {
      setShowTodaySetup(false);
      setSelectedHistoryId(null);
      setActiveTab('history');
    } else if (screen === 'history_detail') {
      setShowTodaySetup(false);
      setActiveTab('history');
      setSelectedHistoryId('hist-04');
    } else if (screen === 'phase2_body') {
      setShowTodaySetup(false);
      setSelectedHistoryId(null);
      setActiveTab('body');
    }
  };

  const editorialStatusBarTone: 'light' | 'dark' =
    sim.phase === 'rest' || sim.phase === 'prepare' || sim.phase === 'nextTransition'
      ? 'light'
      : 'dark';

  const isMoodMode =
    viewMode === 'warm_performance' ||
    viewMode === 'mood_trio' ||
    viewMode === 'mood_baseline_compare';

  const isAnyCinematicMode =
    viewMode === 'cinematic_polished' ||
    viewMode === 'cinematic_compare' ||
    viewMode === 'cinematic';

  const headerQuickLinks: {
    id: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }[] = isMoodMode
    ? [
        {
          id: 'mood-today',
          label: '今日首页',
          active: sim.phase === 'today' && cinemaScreen === 'today' && cinemaInspectIdx === null,
          onClick: () => handleJumpCinematicScreen('today'),
        },
        {
          id: 'mood-active',
          label: '动作进行中',
          active: sim.phase === 'active',
          onClick: () => handleJumpCinematicScreen('active'),
        },
        {
          id: 'mood-rest',
          label: '组间休息',
          active: sim.phase === 'rest',
          onClick: () => handleJumpCinematicScreen('rest'),
        },
        {
          id: 'mood-history',
          label: '训练档案',
          active: sim.phase === 'today' && cinemaScreen === 'history' && cinemaHistoryId === null,
          onClick: () => handleJumpCinematicScreen('history'),
        },
        {
          id: 'mood-history-detail',
          label: '单次详情',
          active: sim.phase === 'today' && cinemaScreen === 'history' && cinemaHistoryId !== null,
          onClick: () => handleJumpCinematicScreen('history_detail'),
        },
      ]
    : isAnyCinematicMode
    ? [
        {
          id: 'cinema-today',
          label: '今日首页',
          active: sim.phase === 'today' && cinemaScreen === 'today',
          onClick: () => handleJumpCinematicScreen('today'),
        },
        {
          id: 'cinema-active',
          label: '训练进行中',
          active: sim.phase === 'active',
          onClick: () => handleJumpCinematicScreen('active'),
        },
        {
          id: 'cinema-rest',
          label: '组间休息',
          active: sim.phase === 'rest',
          onClick: () => handleJumpCinematicScreen('rest'),
        },
        {
          id: 'cinema-history',
          label: '训练档案',
          active: sim.phase === 'today' && cinemaScreen === 'history',
          onClick: () => handleJumpCinematicScreen('history'),
        },
      ]
    : viewMode === 'phase1_app'
    ? [
        {
          id: 'overview',
          label: '训练总览',
          active:
            sim.phase === 'today' &&
            !showTodaySetup &&
            !phase2Subpage &&
            activeTab === 'overview',
          onClick: () => handleJumpPhase1Screen('overview'),
        },
        {
          id: 'plan',
          label: '弹性计划',
          active:
            sim.phase === 'today' &&
            !showTodaySetup &&
            !phase2Subpage &&
            activeTab === 'plan',
          onClick: () => handleJumpPhase1Screen('plan'),
        },
        {
          id: 'history',
          label: '训练历史',
          active:
            sim.phase === 'today' &&
            !showTodaySetup &&
            !phase2Subpage &&
            activeTab === 'history',
          onClick: () => handleJumpPhase1Screen('history'),
        },
        {
          id: 'active',
          label: '动作进行中',
          active: sim.phase === 'active',
          onClick: () => sim.jumpToInspectPhase('active'),
        },
        {
          id: 'rest',
          label: '组间休息',
          active: sim.phase === 'rest',
          onClick: () => sim.jumpToInspectPhase('rest'),
        },
      ]
    : (
        [
          { id: 'today', label: '今日训练' },
          { id: 'active', label: '动作进行中' },
          { id: 'setComplete', label: '完成一组' },
          { id: 'rest', label: '组间休息' },
          { id: 'nextTransition', label: '下一动作' },
        ] as { id: WorkoutPhase; label: string }[]
      ).map((p) => ({
        id: p.id,
        label: p.label,
        active: sim.phase === p.id,
        onClick: () => sim.jumpToInspectPhase(p.id),
      }));

  return (
    <div
      className={`min-h-screen bg-[#F3F2EE] text-[#141413] flex flex-col ${
        a11y.reduceTransparency ? 'lg-a11y-reduce-transparency' : ''
      } ${a11y.increaseContrast ? 'lg-a11y-increase-contrast' : ''}`}
    >
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#F3F2EE]/92 backdrop-blur-md border-b border-[#DCD9D0]">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <span className="text-lg font-bold tracking-tight text-[#141413] whitespace-nowrap shrink-0">
            跟练 · 视觉方向探索
          </span>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#5E5E59]">
            {headerQuickLinks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
                  item.active
                    ? 'text-[#141413] border-[#141413] font-semibold'
                    : 'border-transparent hover:text-[#141413]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-[#F3F2EE] bg-[#141413] rounded-lg hover:bg-[#2C2C2A] transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置回今日</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Mode & Hardware Toolbar (Outside <header>) */}
      <div className="border-b border-[#DCD9D0] bg-[#FAF9F6]">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {WORKSPACE_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectWorkspaceMode(m.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  viewMode === m.id
                    ? 'bg-[#141413] text-[#F3F2EE]'
                    : 'bg-white border border-[#DCD9D0] text-[#4A4A47] hover:border-[#141413] hover:text-[#141413]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex lg:hidden items-center gap-1">
              {headerQuickLinks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap ${
                    item.active ? 'bg-[#141413] text-white' : 'bg-white text-[#5E5E59]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => sim.setUseTestVideoStream(!sim.useTestVideoStream)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                sim.useTestVideoStream
                  ? 'bg-[#141413] text-white border-[#141413]'
                  : 'bg-white text-[#4A4A47] border-[#DCD9D0] hover:border-[#141413]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>{sim.useTestVideoStream ? '测试视频流：开' : '注入测试视频'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setA11y((prev) => ({
                  ...prev,
                  reduceTransparency: !prev.reduceTransparency,
                }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                a11y.reduceTransparency
                  ? 'bg-[#141413] text-white border-[#141413]'
                  : 'bg-white text-[#4A4A47] border-[#DCD9D0] hover:border-[#141413]'
              }`}
            >
              <span>{a11y.reduceTransparency ? '减弱透明：开' : '减弱透明'}</span>
            </button>

            <div className="inline-flex p-0.5 bg-[#E6E4DC] rounded-lg">
              {(
                [
                  { id: 'promax', label: '15 Pro Max' },
                  { id: 'standard', label: '15 / Pro' },
                  { id: 'se', label: 'SE' },
                ] as { id: DeviceSize; label: string }[]
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDeviceSize(d.id)}
                  className={`px-2.5 py-1 text-[11.5px] font-medium rounded-md transition-colors cursor-pointer ${
                    deviceSize === d.id
                      ? 'bg-white text-[#141413] shadow-xs'
                      : 'text-[#5E5E59] hover:text-[#141413]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-8">
        {viewMode === 'warm_performance' && (
          <WarmPerformanceWorkspace
            sim={sim}
            deviceSize={deviceSize}
            reduceMotion={a11y.reduceMotion}
            activeScreen={cinemaScreen}
            onChangeScreen={setCinemaScreen}
            selectedHistoryId={cinemaHistoryId}
            onSelectHistoryId={setCinemaHistoryId}
            inspectedExerciseIdx={cinemaInspectIdx}
            onInspectExerciseIdx={setCinemaInspectIdx}
            onJumpScene={handleJumpCinematicScreen}
          />
        )}

        {(viewMode === 'mood_trio' || viewMode === 'mood_baseline_compare') && (
          <MoodComparisonWorkspace
            mode={viewMode === 'mood_trio' ? 'trio' : 'vs_baseline'}
            sim={sim}
            deviceSize={deviceSize}
            reduceMotion={a11y.reduceMotion}
            activeScreen={cinemaScreen}
            onChangeScreen={setCinemaScreen}
            selectedHistoryId={cinemaHistoryId}
            onSelectHistoryId={setCinemaHistoryId}
            inspectedExerciseIdx={cinemaInspectIdx}
            onInspectExerciseIdx={setCinemaInspectIdx}
            onJumpScene={handleJumpCinematicScreen}
          />
        )}

        {viewMode === 'cinematic_polished' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-24">
              <IPhoneFrame deviceSize={deviceSize} statusBarTone="light">
                <PolishedAppShell
                  sim={sim}
                  deviceSize={deviceSize}
                  reduceMotion={a11y.reduceMotion}
                  activeScreen={cinemaScreen}
                  onChangeScreen={setCinemaScreen}
                  selectedHistoryId={cinemaHistoryId}
                  onSelectHistoryId={setCinemaHistoryId}
                  inspectedExerciseIdx={cinemaInspectIdx}
                  onInspectExerciseIdx={setCinemaInspectIdx}
                />
              </IPhoneFrame>
            </div>

            <div className="lg:col-span-7 bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-9">
              <PolishedComparisonPanel
                sim={sim}
                activeScreen={cinemaScreen}
                selectedHistoryId={cinemaHistoryId}
                inspectedExerciseIdx={cinemaInspectIdx}
                onJumpScreen={handleJumpCinematicScreen}
              />
            </div>
          </div>
        )}

        {viewMode === 'cinematic_compare' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start justify-items-center">
              <div className="flex flex-col items-center w-full">
                <div className="mb-4 text-center">
                  <div className="text-xs font-semibold tracking-wider text-[#5E5E59]">
                    BEFORE · Cinematic v1（精修前）
                  </div>
                  <div className="text-sm font-medium text-[#4A4A47] mt-0.5">
                    暗部偏死、棚拍/黑房割裂、流媒体横滑卡片与营销栏目词
                  </div>
                </div>
                <IPhoneFrame deviceSize={deviceSize} statusBarTone="light">
                  <CinematicAppShell
                    sim={sim}
                    deviceSize={deviceSize}
                    reduceMotion={a11y.reduceMotion}
                    activeScreen={cinemaScreen}
                    onChangeScreen={setCinemaScreen}
                    selectedHistoryId={cinemaHistoryId}
                    onSelectHistoryId={setCinemaHistoryId}
                  />
                </IPhoneFrame>
              </div>

              <div className="flex flex-col items-center w-full">
                <div className="mb-4 text-center">
                  <div className="text-xs font-semibold tracking-wider text-[#8C3B2B]">
                    AFTER · 全屏舞台 × 统一暮色居家摄影（精修后）
                  </div>
                  <div className="text-sm font-medium text-[#4A4A47] mt-0.5">
                    9:16 满屏舞台＋悬浮控件、全套 8 动作统一影调、底栏零遮挡与 5 组连续转场
                  </div>
                </div>
                <IPhoneFrame deviceSize={deviceSize} statusBarTone="light">
                  <PolishedAppShell
                    sim={sim}
                    deviceSize={deviceSize}
                    reduceMotion={a11y.reduceMotion}
                    activeScreen={cinemaScreen}
                    onChangeScreen={setCinemaScreen}
                    selectedHistoryId={cinemaHistoryId}
                    onSelectHistoryId={setCinemaHistoryId}
                    inspectedExerciseIdx={cinemaInspectIdx}
                    onInspectExerciseIdx={setCinemaInspectIdx}
                  />
                </IPhoneFrame>
              </div>
            </div>

            <div className="bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-8">
              <PolishedComparisonPanel
                sim={sim}
                activeScreen={cinemaScreen}
                selectedHistoryId={cinemaHistoryId}
                inspectedExerciseIdx={cinemaInspectIdx}
                onJumpScreen={handleJumpCinematicScreen}
              />
            </div>
          </div>
        )}

        {viewMode === 'cinematic' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-24">
              <IPhoneFrame deviceSize={deviceSize} statusBarTone="light">
                <CinematicAppShell
                  sim={sim}
                  deviceSize={deviceSize}
                  reduceMotion={a11y.reduceMotion}
                  activeScreen={cinemaScreen}
                  onChangeScreen={setCinemaScreen}
                  selectedHistoryId={cinemaHistoryId}
                  onSelectHistoryId={setCinemaHistoryId}
                />
              </IPhoneFrame>
            </div>

            <div className="lg:col-span-7 bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-9">
              <CinematicSpecPanel
                sim={sim}
                activeScreen={cinemaScreen}
                selectedHistoryId={cinemaHistoryId}
                onJumpScreen={handleJumpCinematicScreen}
              />
            </div>
          </div>
        )}

        {viewMode === 'phase1_app' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-24">
              <IPhoneFrame deviceSize={deviceSize} statusBarTone="light">
                <GenLianAppShell
                  sim={sim}
                  deviceSize={deviceSize}
                  a11y={a11y}
                  activeTab={activeTab}
                  onChangeTab={setActiveTab}
                  showTodaySetup={showTodaySetup}
                  onToggleTodaySetup={setShowTodaySetup}
                  selectedHistoryId={selectedHistoryId}
                  onSelectHistoryId={setSelectedHistoryId}
                  phase2Subpage={phase2Subpage}
                  onChangePhase2Subpage={setPhase2Subpage}
                />
              </IPhoneFrame>
            </div>

            <div className="lg:col-span-7 bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-9">
              <Phase1SpecPanel
                sim={sim}
                activeTab={activeTab}
                showTodaySetup={showTodaySetup}
                selectedHistoryId={selectedHistoryId}
                phase2Subpage={phase2Subpage}
                a11y={a11y}
                onChangeA11y={setA11y}
                onJumpScreen={handleJumpPhase1Screen}
              />
            </div>
          </div>
        )}

        {viewMode === 'lg_compare' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start justify-items-center">
              <div className="flex flex-col items-center w-full">
                <div className="mb-4 text-center">
                  <div className="text-xs font-semibold tracking-wider text-[#5E5E59]">
                    BASELINE · 原版 B1.5 对照
                  </div>
                  <div className="text-sm font-medium text-[#4A4A47] mt-0.5">
                    全套 B1.5 原版基线 · 大块半透黑底坞包覆全部底部按钮
                  </div>
                </div>
                <IPhoneFrame deviceSize={deviceSize} statusBarTone="light">
                  <SchemeBPrototype sim={sim} deviceSize={deviceSize} />
                </IPhoneFrame>
              </div>

              <div className="flex flex-col items-center w-full">
                <div className="mb-4 text-center">
                  <div className="text-xs font-semibold tracking-wider text-[#141413]">
                    EXPERIMENT · B1.5 LIQUID GLASS（训练中实验）
                  </div>
                  <div className="text-sm font-medium text-[#4A4A47] mt-0.5">
                    纯实色高对比主按钮 × 4 组悬浮光学玻璃控件（其余页保持原版）
                  </div>
                </div>
                <IPhoneFrame deviceSize={deviceSize} statusBarTone="light">
                  <SchemeBLiquidGlassPrototype
                    sim={sim}
                    deviceSize={deviceSize}
                    a11y={a11y}
                  />
                </IPhoneFrame>
              </div>
            </div>

            <div className="bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-8">
              <LiquidGlassComparisonPanel
                sim={sim}
                a11y={a11y}
                onChangeA11y={setA11y}
              />
            </div>
          </div>
        )}

        {viewMode === 'liquid_glass' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-24">
              <IPhoneFrame deviceSize={deviceSize} statusBarTone="light">
                <SchemeBLiquidGlassPrototype
                  sim={sim}
                  deviceSize={deviceSize}
                  a11y={a11y}
                />
              </IPhoneFrame>
            </div>
            <div className="lg:col-span-7 bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-9">
              <LiquidGlassComparisonPanel
                sim={sim}
                a11y={a11y}
                onChangeA11y={setA11y}
              />
            </div>
          </div>
        )}

        {viewMode === 'baseline' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-24">
              <IPhoneFrame deviceSize={deviceSize} statusBarTone="light">
                <SchemeBPrototype sim={sim} deviceSize={deviceSize} />
              </IPhoneFrame>
            </div>
            <div className="lg:col-span-7 bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-9">
              <SchemeBSpecPanel
                sim={sim}
                deviceSize={deviceSize}
                onSelectDevice={setDeviceSize}
              />
            </div>
          </div>
        )}

        {viewMode === 'compare' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start justify-items-center">
              <div className="flex flex-col items-center w-full">
                <div className="mb-4 text-center">
                  <div className="text-xs font-semibold tracking-wider text-[#2B3D30]">
                    DIRECTION A · 高级运动品牌
                  </div>
                  <div className="text-sm font-medium text-[#4A4A47] mt-0.5">
                    暖矿物纸 × 深森林苔绿 × 自然光建筑摄影
                  </div>
                </div>
                <IPhoneFrame deviceSize={deviceSize} statusBarTone={editorialStatusBarTone}>
                  <SchemeEditorialPrototype sim={sim} deviceSize={deviceSize} />
                </IPhoneFrame>
              </div>

              <div className="flex flex-col items-center w-full">
                <div className="mb-4 text-center">
                  <div className="text-xs font-semibold tracking-wider text-[#C24A20]">
                    DIRECTION B · 精密运动设备
                  </div>
                  <div className="text-sm font-medium text-[#4A4A47] mt-0.5">
                    阳极氧化石墨 × 信号朱红 × 精密机械刻度
                  </div>
                </div>
                <IPhoneFrame deviceSize={deviceSize} statusBarTone="light">
                  <SchemePrecisionPrototype sim={sim} deviceSize={deviceSize} />
                </IPhoneFrame>
              </div>
            </div>

            <div className="bg-white border border-[#DCD9D0] rounded-2xl p-6 sm:p-8">
              <DesignExplorationPanel mode="compare" sim={sim} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
