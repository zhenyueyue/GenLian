import React from 'react';
import { USER_CONTEXT } from '../data/workouts';
import { useWorkoutSimulator } from '../hooks/useWorkoutSimulator';
import { WorkoutPhase } from '../types/design';

export type WorkspaceViewMode = 'editorial' | 'precision' | 'compare' | 'baseline';

interface DesignExplorationPanelProps {
  mode: WorkspaceViewMode;
  sim: ReturnType<typeof useWorkoutSimulator>;
}

const B15_DIAGNOSIS = [
  {
    dim: '1. 荧光绿泛滥',
    issue: 'B1.5 将 #C8F542 涂抹在按钮、数字、角标、进度条与描边上，产生典型「暗色运动模板」的廉价兴奋感。',
  },
  {
    dim: '2. 字体辨识度弱',
    issue: 'Outfit + JetBrains Mono 偏通用科技感，字重几乎全靠 700/800 硬撑，缺少品牌气质与排版张力。',
  },
  {
    dim: '3. 模板化圆角胶囊',
    issue: '24px 大圆角 + 半透明黑底 + backdrop-blur 悬浮底坞与 10% 白描边，属于标准 AI 卡片拼装件。',
  },
  {
    dim: '4. 摄影与文字割裂',
    issue: '暗色健身房广告棚拍硬压上从底向上的纯黑渐变遮罩，画面呼吸感被黑底吃掉一半。',
  },
  {
    dim: '5. 粗大字号掩盖层级',
    issue: '休息页 92px 粗体、标题 28px Extrabold、次数 26px 粗体同时抢戏，缺乏静与动的节奏对比。',
  },
  {
    dim: '6. 偏健身房宣传味',
    issue: '高反差暗棚 + 荧光绿像商业课推销海报，不像一个每天在家陪练的成熟私人工具。',
  },
  {
    dim: '7. 跨页语言不一致',
    issue: '首页/总结偏常规暗色列表，训练页偏深黑视频播放器，4 个核心页面之间没有共同的设计语法。',
  },
];

const SUPPORTING_PHASES: { id: WorkoutPhase; label: string }[] = [
  { id: 'prepare', label: '训练准备倒计时' },
  { id: 'setComplete', label: '完成一组微调' },
  { id: 'nextTransition', label: '下一动作过渡' },
];

export const DesignExplorationPanel: React.FC<DesignExplorationPanelProps> = ({
  mode,
  sim,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="pb-5 border-b border-[#DCD9D0]">
        <div className="font-mono-num text-[11px] tracking-wider text-[#5E5E59]">
          DESIGN EXPLORATION · 两组独立视觉语言系统
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#141413]">
          {mode === 'editorial'
            ? '方向 A · 高级运动品牌（Editorial Athletic Brand）'
            : mode === 'precision'
            ? '方向 B · 精密运动设备（Precision Athletic Instrument）'
            : 'A / B 平行视觉语言对比'}
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#4A4A47]">
          两个方向共享同一套严格训练状态机（3 轮 × 4 动作、单臂左右、实际次数微调、真实休息计时与 10 档配重库存），但在色彩哲学、字体排印、控件文法、摄影棚光与跨页一致性上完全独立探索，不预先混合。
        </p>
        <div className="mt-2 text-xs text-[#6A6A66]">
          {USER_CONTEXT.profileBrief} · {USER_CONTEXT.plateInventoryNote}
        </div>
      </div>

      {/* Direction A vs Direction B Architecture Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`p-5 rounded-xl border transition-colors ${
            mode === 'editorial'
              ? 'bg-[#F4F1EA] border-[#2B3D30]'
              : 'bg-[#FAF9F6] border-[#DCD9D0]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-[#2B3D30]">
              DIRECTION A · 高级运动品牌
            </span>
            <span className="text-[11px] text-[#646158]">Tracksmith × Aesop 建筑运动感</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-[#DCD6C9] bg-[#F4F1EA]" title="#F4F1EA 矿物纸" />
            <span className="w-6 h-6 rounded bg-[#2B3D30]" title="#2B3D30 深森林苔绿" />
            <span className="w-6 h-6 rounded bg-[#1B1917]" title="#1B1917 暮色木炭" />
            <span className="w-6 h-6 rounded bg-[#9A4D33]" title="#9A4D33 陶土警示" />
            <span className="text-[11.5px] text-[#5C5951] ml-1">暖矿物纸 + 深苔绿 + 暮色恢复态</span>
          </div>
          <ul className="mt-3 space-y-1.5 text-[12px] text-[#3E3C37] leading-relaxed">
            <li>· <strong>字体：</strong>Fraunces + 思源宋体（克制中字重）配 Plus Jakarta Sans，不再靠大黑粗体抢视觉。</li>
            <li>· <strong>组件文法：</strong>1px 细分割线、下划线标签、6–8px 建筑矩形按键，彻底移除 24px 磨砂黑胶囊。</li>
            <li>· <strong>摄影风格：</strong>统一自然日照石灰岩建筑工作室 9:16 实景，人物居中上、底部留净空给控制区。</li>
          </ul>
        </div>

        <div
          className={`p-5 rounded-xl border transition-colors ${
            mode === 'precision'
              ? 'bg-[#111316] text-[#F0F2F5] border-[#E05A2B]'
              : 'bg-[#FAF9F6] text-[#141413] border-[#DCD9D0]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold tracking-wide ${
                mode === 'precision' ? 'text-[#E05A2B]' : 'text-[#C24A20]'
              }`}
            >
              DIRECTION B · 精密运动设备
            </span>
            <span className={mode === 'precision' ? 'text-[11px] text-[#8E96A3]' : 'text-[11px] text-[#646158]'}>
              Braun × Leica 精密器械感
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-[#2C313A] bg-[#111316]" title="#111316 阳极石墨" />
            <span className="w-6 h-6 rounded border border-[#2C313A] bg-[#181B20]" title="#181B20 精密钛灰" />
            <span className="w-6 h-6 rounded bg-[#E05A2B]" title="#E05A2B 信号朱红" />
            <span className="w-6 h-6 rounded bg-[#C8D0DC]" title="#C8D0DC 冷钛白" />
            <span
              className={`text-[11.5px] ml-1 ${
                mode === 'precision' ? 'text-[#C8D0DC]' : 'text-[#5C5951]'
              }`}
            >
              哑光阳极石墨 + 单一信号朱红
            </span>
          </div>
          <ul
            className={`mt-3 space-y-1.5 text-[12px] leading-relaxed ${
              mode === 'precision' ? 'text-[#C8D0DC]' : 'text-[#3E3C37]'
            }`}
          >
            <li>· <strong>字体：</strong>Manrope 几何无衬线 + IBM Plex Mono 精密等宽刻度，克制且高可读，零赛博/游戏 HUD。</li>
            <li>· <strong>组件文法：</strong>哑光实心硬件面板、对称哑铃装片示意图、千分尺微调次数拨盘、刻度线休息尺。</li>
            <li>· <strong>摄影风格：</strong>统一冷灰清水混凝土北向漫射光影棚，人物动作轮廓清晰，无暗角泥泞感。</li>
          </ul>
        </div>
      </section>

      {/* Supporting Flow Inspection & Live Telemetry */}
      <section className="p-4 rounded-xl bg-white border border-[#DCD9D0] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#141413]">完整流程串联与辅助状态检查</span>
          <span className="font-mono-num text-[11px] text-[#5E5E59]">
            phase: {sim.phase} · 第 {sim.currentRound}/{sim.plan.rounds} 轮 · 动作 {sim.exerciseIdx + 1}/
            {sim.totalExercisesInRound} · 已录 {sim.loggedSets.length} 组
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SUPPORTING_PHASES.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => sim.jumpToInspectPhase(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                sim.phase === st.id
                  ? 'bg-[#141413] text-white border-[#141413]'
                  : 'bg-[#FAF9F6] text-[#4A4A47] border-[#DCD9D0] hover:border-[#141413]'
              }`}
            >
              {st.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => sim.setIsPaused(!sim.isPaused)}
            disabled={sim.phase === 'today' || sim.phase === 'summary'}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#DCD9D0] bg-[#FAF9F6] text-[#4A4A47] disabled:opacity-40 cursor-pointer"
          >
            {sim.isPaused ? '取消暂停遮罩' : '预览暂停遮罩'}
          </button>
        </div>
      </section>

      {/* 7-Dimension Critique of B1.5 */}
      <section className="p-5 rounded-xl bg-[#FAF9F6] border border-[#DCD9D0]">
        <div className="text-xs font-bold text-[#141413] mb-3">
          B1.5 为什么仍有「AI 模板感」—— 7 维度视觉诊断与本轮修正
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {B15_DIAGNOSIS.map((item) => (
            <div key={item.dim} className="text-[12px] leading-relaxed">
              <div className="font-semibold text-[#141413]">{item.dim}</div>
              <div className="text-[#5E5E59] mt-0.5">{item.issue}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
