import React, { useState } from 'react';
import { useWorkoutSimulator } from '../hooks/useWorkoutSimulator';
import { DeviceSize } from '../types/design';
import { PolishedAppShell } from './cinematic-polished/PolishedAppShell';
import { PolishedScreen } from './cinematic-polished/polishedMedia';
import { IPhoneFrame } from './IPhoneFrame';
import { MoodAppShell } from './mood-explorations/MoodAppShell';
import { MOOD_THEMES, MoodId } from './mood-explorations/moodThemes';

export type MoodJumpTarget =
  | 'today'
  | 'detail'
  | 'active'
  | 'rest'
  | 'summary'
  | 'history'
  | 'history_detail';

interface MoodComparisonWorkspaceProps {
  mode: 'trio' | 'vs_baseline';
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

const CORE_FIVE_SCENES: { id: MoodJumpTarget; label: string; shortDesc: string }[] = [
  { id: 'today', label: '1. 今日首页', shortDesc: '全幅日光 Hero 与动作顺序' },
  { id: 'active', label: '2. 动作进行中', shortDesc: '明亮清晰全屏舞台' },
  { id: 'rest', label: '3. 组间休息', shortDesc: '平滑降亮进入恢复节奏' },
  { id: 'history', label: '4. 训练档案', shortDesc: '轻盈高通透内容档案' },
  { id: 'history_detail', label: '5. 单次训练详情', shortDesc: '大气头图与逐轮实录' },
];

const EXTRA_SCENES: { id: MoodJumpTarget; label: string }[] = [
  { id: 'detail', label: '连续动作详情' },
  { id: 'summary', label: '训练总结页' },
];

const MOOD_LIST: MoodId[] = ['daylight', 'airy', 'dynamic'];

export const MoodComparisonWorkspace: React.FC<MoodComparisonWorkspaceProps> = ({
  mode,
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
  const [compareMoodId, setCompareMoodId] = useState<MoodId>('daylight');

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

  const hasDetail = inspectedExerciseIdx !== null;
  const hasHistoryDetail = selectedHistoryId !== null;

  return (
    <div className="space-y-8">
      {/* 顶部控制条：五核心场景一键同步切换 + 视觉指导概要 */}
      <section className="rounded-2xl bg-white border border-[#DCD9D0] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E3DC] pb-4">
          <div className="max-w-3xl">
            <div className="text-[11px] font-mono-num font-semibold tracking-wider text-[#2356D8]">
              VISUAL MOOD &amp; COLOR ART DIRECTION · 三套明亮运动情绪平行探索（共 15 屏）
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#141413] mt-1">
              {mode === 'trio'
                ? 'A 日光运动 × B 清透运动 × C 活力竞技 · 同数据五场景平行对比'
                : '现版暗色基线 vs 明亮运动情绪方向 · 1:1 真实对照'}
            </h1>
            <p className="mt-1.5 text-sm text-[#4A4A47] leading-relaxed">
              严格保留现有全幅 Hero、全屏动作舞台、信息架构与训练状态机，独立重塑光影、自然采光摄影、画布明度与休息降亮节奏。点按下方任意场景，所有样机同步切换，也可直接在手机屏内完整实操。
            </p>
          </div>

          {mode === 'vs_baseline' && (
            <div className="inline-flex p-1 rounded-xl bg-[#F3F2EE] border border-[#E5E3DC] shrink-0">
              {MOOD_LIST.map((mId) => {
                const m = MOOD_THEMES[mId];
                const active = compareMoodId === mId;
                return (
                  <button
                    key={mId}
                    type="button"
                    onClick={() => setCompareMoodId(mId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#141413] text-white'
                        : 'text-[#4A4A47] hover:text-[#141413]'
                    }`}
                  >
                    {m.code} · {m.nameZh}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 五大核心场景同步器 + 延伸过渡 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {CORE_FIVE_SCENES.map((scene) => {
              const active = isSceneActive(scene.id);
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => onJumpScene(scene.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#141413] text-white shadow-sm'
                      : 'bg-[#F3F2EE] text-[#4A4A47] hover:bg-[#E7E5DC] hover:text-[#141413]'
                  }`}
                >
                  {scene.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            {EXTRA_SCENES.map((scene) => {
              const active = isSceneActive(scene.id);
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => onJumpScene(scene.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#141413] text-white border-[#141413]'
                      : 'bg-white text-[#5E5E59] border-[#DCD9D0] hover:border-[#141413]'
                  }`}
                >
                  {scene.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {mode === 'trio' ? (
        /* 三列平行样机对比：A / B / C */
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {MOOD_LIST.map((moodId) => {
            const theme = MOOD_THEMES[moodId];
            const statusTone = theme.getStatusBarTone(
              sim.phase,
              activeScreen,
              hasDetail,
              hasHistoryDetail
            );
            return (
              <div key={moodId} className="flex flex-col items-center">
                {/* 方向规格头卡 */}
                <div className="w-full max-w-[412px] mb-4 rounded-2xl bg-white border border-[#DCD9D0] p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm font-semibold text-[#141413]">
                      {theme.code} · {theme.nameZh}
                      <span className="ml-1.5 text-xs font-normal text-[#6E706A]">
                        {theme.nameEn}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs font-medium text-[#4A4A47]">{theme.tagline}</div>

                  {/* 色板切片 */}
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {theme.paletteSwatches.map((sw) => (
                      <div key={sw.hex} className="space-y-1">
                        <div
                          className="h-6 w-full rounded-md border border-black/10"
                          style={{ backgroundColor: sw.hex }}
                        />
                        <div className="text-[10.5px] text-[#5E5E59] truncate">{sw.label}</div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-[#5E5E59] leading-relaxed">{theme.summary}</p>
                </div>

                {/* 实机可交互展示 */}
                <IPhoneFrame deviceSize={deviceSize} statusBarTone={statusTone}>
                  <MoodAppShell
                    moodId={moodId}
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

                {/* 光影与休息机制说明 */}
                <div className="w-full max-w-[412px] mt-4 rounded-xl bg-white border border-[#DCD9D0] p-3.5 space-y-1.5 text-xs text-[#4A4A47] leading-relaxed">
                  <div>
                    <span className="font-semibold text-[#141413]">摄影与光线：</span>
                    {theme.lightingSpec}
                  </div>
                  <div>
                    <span className="font-semibold text-[#141413]">进行 ↔ 休息：</span>
                    {theme.restBehaviorSpec}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        /* 现版暗色基线 vs 任一情绪方向 1:1 对照 */
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start justify-items-center">
          <div className="flex flex-col items-center w-full">
            <div className="mb-4 text-center">
              <div className="text-xs font-semibold tracking-wider text-[#5E5E59]">
                BASELINE · 现版 Cinematic 暮色精修（对比基线）
              </div>
              <div className="text-sm font-medium text-[#4A4A47] mt-0.5">
                暖炭黑底色 · 暖白/黄铜 · 暮色低照度居家摄影
              </div>
            </div>
            <IPhoneFrame deviceSize={deviceSize} statusBarTone="light">
              <PolishedAppShell
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
            const theme = MOOD_THEMES[compareMoodId];
            const statusTone = theme.getStatusBarTone(
              sim.phase,
              activeScreen,
              hasDetail,
              hasHistoryDetail
            );
            return (
              <div className="flex flex-col items-center w-full">
                <div className="mb-4 text-center">
                  <div className="text-xs font-semibold tracking-wider text-[#2356D8]">
                    MOOD {theme.code} · {theme.nameZh}（{theme.nameEn}）
                  </div>
                  <div className="text-sm font-medium text-[#4A4A47] mt-0.5">{theme.tagline}</div>
                </div>
                <IPhoneFrame deviceSize={deviceSize} statusBarTone={statusTone}>
                  <MoodAppShell
                    moodId={compareMoodId}
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
      )}
    </div>
  );
};
