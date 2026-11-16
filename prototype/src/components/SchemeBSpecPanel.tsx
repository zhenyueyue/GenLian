import React from 'react';
import { USER_CONTEXT } from '../data/workouts';
import { useWorkoutSimulator } from '../hooks/useWorkoutSimulator';
import { DeviceSize, WorkoutPhase } from '../types/design';

interface SchemeBSpecPanelProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  deviceSize: DeviceSize;
  onSelectDevice: (size: DeviceSize) => void;
}

const DEBUG_INSPECT_STAGES: { id: WorkoutPhase; step: string; label: string; desc: string }[] = [
  { id: 'today', step: '01', label: '今日训练', desc: '真实入口首页：配重、休息预设与非遮挡动作列表' },
  { id: 'prepare', step: '02', label: '训练准备', desc: '开练前姿态就位与启动倒计时' },
  { id: 'active', step: '03', label: '动作进行中', desc: 'B1.5 全屏舞台 + 右缘拇指次数标尺 + 磨砂底坞' },
  { id: 'setComplete', step: '04', label: '完成一组', desc: '亮起荧光绿内框微光 + 微调实录次数与主观难度' },
  { id: 'rest', step: '05', label: '组间休息', desc: '深色去饱和压暗 + 超大号中心倒计时 + 极细进度线 + 下个动作预告' },
  { id: 'nextTransition', step: '06', label: '下一动作', desc: '切换至新动作视觉与全屏居中重新聚焦' },
  { id: 'summary', step: '07', label: '结束 / 总结', desc: '真实操作实录汇总（区分完整 / 部分 / 0组退出）' },
];

export const SchemeBSpecPanel: React.FC<SchemeBSpecPanelProps> = ({
  sim,
  deviceSize,
  onSelectDevice,
}) => {
  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#DCD9D0]">
        <div className="font-mono-num text-[11px] tracking-wider text-[#5E5E59]">
          SCHEME B1.5 · 视觉定版与 Codex 交付验收台
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#141413]">
          方案 B1.5 交付基线原型
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#4A4A47]">
          左侧 iPhone 默认从真实「今日训练」首页进入，请直接点击「开始今日跟练」完整走通 3 轮 × 4 动作。设计交付文档已整理至项目根目录 <span className="font-mono-num font-semibold text-[#141413]">DESIGN_HANDOFF_CODEX.md</span>。
        </p>
        <div className="mt-2 text-xs text-[#6A6A66]">
          {USER_CONTEXT.profileBrief} · {USER_CONTEXT.plateInventoryNote}
        </div>
      </div>

      {/* 1. 真实用户操作状态监视 */}
      <section className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E3DC]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-[#141413]">真实训练流程监视（只读观测）</span>
          <span className="font-mono-num text-[11px] font-semibold text-[#141413]">
            {sim.isDebugPreviewMode ? '模式：调试直达预览' : '模式：真实操作流'} · phase: {sim.phase}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-[#6A6A66]">当前轮数</div>
            <div className="font-mono-num font-bold text-[#141413] mt-0.5">
              第 {sim.currentRound} / {sim.plan.rounds} 轮
            </div>
          </div>
          <div>
            <div className="text-[#6A6A66]">当前动作</div>
            <div className="font-mono-num font-bold text-[#141413] mt-0.5 truncate">
              {sim.exerciseIdx + 1}/{sim.totalExercisesInRound} · {sim.currentExercise.name}
            </div>
          </div>
          <div>
            <div className="text-[#6A6A66]">单侧状态</div>
            <div className="font-mono-num font-bold text-[#141413] mt-0.5">
              {sim.currentSide === 'left'
                ? '左侧进行中'
                : sim.currentSide === 'right'
                ? '右侧进行中'
                : '双侧 / 徒手'}
            </div>
          </div>
          <div>
            <div className="text-[#6A6A66]">实录 / 跳过 / 暂停</div>
            <div className="font-mono-num font-bold text-[#141413] mt-0.5">
              {sim.loggedSets.length} 组 / {sim.skippedRecords.length} 跳 / {sim.pausedSeconds}s
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#E5E3DC] flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#5E5E59]">
          <span>
            当前示范媒体：
            <strong className="text-[#141413]">
              {sim.activeVideoUrl ? '循环 MP4 测试流播放中' : '无实拍视频（明确占位态）'}
            </strong>
          </span>
          <span className="font-mono-num">
            outcome: {sim.sessionOutcome} · 起止 {sim.sessionStartedAt || '--'} → {sim.sessionEndedAt || '--'}
          </span>
        </div>
      </section>

      {/* 2. 原型调试专区（明确与真实操作区分） */}
      <section className="p-4 rounded-xl bg-white border border-dashed border-[#C7C4B8] space-y-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#141413]">
              原型调试工具（非正式 App UI · 仅用于视觉与能力验机）
            </h3>
          </div>
          <p className="mt-1 text-[12px] text-[#5E5E59]">
            下方按钮用于直接跳转各页面状态或注入测试视频流以检验 HTML5 视频播放能力；跳转不会伪造完成组数据。
          </p>
        </div>

        {/* 视频能力测试开关 */}
        <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#141413]">动作视频播放能力测试</div>
            <div className="text-[11.5px] text-[#5E5E59] mt-0.5">
              {sim.useTestVideoStream
                ? '已为「力量 A」动作 1、2 注入循环 MP4 测试流（可测切换/循环/静音/重播），动作 3、4 保持占位态'
                : '当前为真实现状：全动作无实拍视频，统一显示明确占位态（不冒充视频）'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => sim.setUseTestVideoStream(!sim.useTestVideoStream)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              sim.useTestVideoStream
                ? 'bg-[#141413] text-[#C8F542]'
                : 'bg-white border border-[#DCD9D0] text-[#141413] hover:border-[#141413]'
            }`}
          >
            {sim.useTestVideoStream ? '恢复真实现状（全占位）' : '注入测试视频流验证播放'}
          </button>
        </div>

        {/* 语音与自动休息开关 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => sim.setRestAutoAdvance(!sim.restAutoAdvance)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#DCD9D0] bg-white hover:border-[#141413] cursor-pointer"
          >
            休息结束：{sim.restAutoAdvance ? '自动下一动作' : '等手动确认'}
          </button>
          <button
            type="button"
            onClick={() => sim.setSoundEnabled(!sim.soundEnabled)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
              sim.soundEnabled
                ? 'bg-[#141413] text-white border-[#141413]'
                : 'bg-white text-[#5E5E59] border-[#DCD9D0]'
            }`}
          >
            语音提示：{sim.soundEnabled ? '开' : '关'}
          </button>
          <button
            type="button"
            onClick={() => sim.setVideoMuted(!sim.videoMuted)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#DCD9D0] bg-white hover:border-[#141413] cursor-pointer"
          >
            视频音轨：{sim.videoMuted ? '静音' : '原声'}
          </button>
        </div>

        {/* 单态直达检查 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEBUG_INSPECT_STAGES.map((stage) => {
            const active = sim.phase === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => sim.jumpToInspectPhase(stage.id)}
                className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#141413] text-[#F3F2EE] border-[#141413]'
                    : 'bg-[#FAF9F6] text-[#141413] border-[#E5E3DC] hover:border-[#141413]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold">
                    {stage.step}. {stage.label}
                  </span>
                  {active && (
                    <span className="font-mono-num text-[10px] text-[#C8F542]">当前</span>
                  )}
                </div>
                <p
                  className={`mt-1 text-[11.5px] leading-snug ${
                    active ? 'text-[#C8C7C2]' : 'text-[#5E5E59]'
                  }`}
                >
                  {stage.desc}
                </p>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-[#E5E3DC] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#141413]">iPhone 尺寸适配验证</span>
          <div className="inline-flex p-1 bg-[#E5E3DC] rounded-lg">
            {(
              [
                { id: 'promax', label: '15 Pro Max' },
                { id: 'standard', label: '15 / Pro' },
                { id: 'se', label: 'SE 小屏' },
              ] as { id: DeviceSize; label: string }[]
            ).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelectDevice(d.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
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
      </section>
    </div>
  );
};
