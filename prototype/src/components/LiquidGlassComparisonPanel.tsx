import React from 'react';
import { useWorkoutSimulator } from '../hooks/useWorkoutSimulator';
import { WorkoutPhase } from '../types/design';
import { LiquidGlassA11yConfig } from './liquid/LiquidGlassPrimitives';

interface LiquidGlassComparisonPanelProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  a11y: LiquidGlassA11yConfig;
  onChangeA11y: (next: LiquidGlassA11yConfig) => void;
}

const INSPECT_PHASES: { id: WorkoutPhase; label: string }[] = [
  { id: 'active', label: '动作进行中（本轮核心实验页）' },
  { id: 'today', label: '今日训练（已回退原版基线）' },
  { id: 'setComplete', label: '完成一组（原版基线）' },
  { id: 'rest', label: '组间休息（原版基线）' },
  { id: 'nextTransition', label: '下一动作（原版基线）' },
  { id: 'summary', label: '训练总结（原版基线）' },
];

const FOUR_TARGET_CONTROLS = [
  {
    name: '1. 顶部退出按钮',
    before: '深灰黑胶囊（black/45），在画面边缘略显沉重。',
    after: '轻盈低不透明度光学玻璃胶囊，允许背后视频光影自然透出，点击呈轻弹反馈。',
  },
  {
    name: '2. 顶部音量控制',
    before: '开启状态整颗涂成实心荧光绿圆钮，存在感过强，抢了运动舞台焦点。',
    after: '与退出钮成对的轻盈圆形玻璃透镜，去实心绿底，保留清晰白色图标。',
  },
  {
    name: '3. 右侧次数调节器',
    before: '20px 圆角深黑底座 + 3 块内部小方框按钮，整体偏厚重。',
    after: '一体式竖向液态玻璃胶囊，+ / 数字 / − 共享同一个光学曲面，仅用短细线轻微分隔。',
  },
  {
    name: '4. 底部非主操作控件 & 空间关系',
    before: '把实色主按钮与 3 颗次级按钮一起塞进一个大黑盒底坞里，压住下方约 44% 画面。',
    after: '拆掉大黑盒底坞：主完成按钮保持高对比纯实色 #C8F542 独立悬浮；「上一动作 / 暂停 / 跳过」及视频控制归入轻盈玻璃条，与主按钮拉开真实空气间隙，让视频透出。',
  },
];

const SWIFTUI_MAPPING = [
  {
    role: '顶部退出 & 音量浮钮',
    webSim: '低不透明度中性透镜（rgba 0.22）+ 背景亮度/饱和度采样 + 0.6px 上缘高光',
    swiftuiApi: 'Button(...) { ... }.buttonStyle(.glass)',
  },
  {
    role: '右侧一体式次数胶囊',
    webSim: '一体式 rounded-full 光学容器 + 内收短细分割线 + 点击微弹',
    swiftuiApi: 'VStack { ... }.glassEffect(.regular.interactive(), in: .capsule)',
  },
  {
    role: '底部非主操作栏',
    webSim: '独立悬浮于实色主按钮下方的窄幅玻璃长条，中缝留空透出视频',
    swiftuiApi: 'GlassEffectContainer { HStack { ... }.glassEffect(.regular.interactive(), in: .capsule) }',
  },
  {
    role: '主完成按钮（完成本动作）',
    webSim: '保留纯净高对比度实色 #C8F542（无渐变、无玻璃、无白边）',
    swiftuiApi: '保持实色高对比主按钮，不强行玻璃化（或仅由系统承载基础圆角按压反馈）',
  },
];

export const LiquidGlassComparisonPanel: React.FC<LiquidGlassComparisonPanelProps> = ({
  sim,
  a11y,
  onChangeA11y,
}) => {
  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#DCD9D0]">
        <div className="font-mono-num text-[11px] tracking-wider text-[#5E5E59]">
          FOCUSED EXPERIMENT · 仅聚焦「训练进行中」4 组悬浮控件
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#141413]">
          B1.5 原版 vs Liquid Glass（动作进行中对比）
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#4A4A47]">
          已撤回首页的强制玻璃化改动（首页与其余页面严格维持干净统一的原版 B1.5 基线）。本轮仅在具有全屏动态视频背景的<strong>「训练进行中」</strong>页面，针对 4 组非主悬浮控件探索真实空间层级与通透质感，主完成按钮保持纯实色高对比度。
        </p>
      </div>

      {/* Stage & Video Test + Accessibility */}
      <section className="p-4 rounded-xl bg-[#FAF9F6] border border-[#DCD9D0] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#141413]">
            视频背景采样测试 & 辅助功能降级验证
          </span>
          <span className="font-mono-num text-[11px] text-[#5E5E59]">
            当前页面：{sim.phase} · 媒体：{sim.activeVideoUrl ? '动态 MP4 循环中' : '高清竖屏静态参考'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => sim.setUseTestVideoStream(!sim.useTestVideoStream)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              sim.useTestVideoStream
                ? 'bg-[#141413] text-[#C8F542] border-[#141413]'
                : 'bg-white text-[#141413] border-[#DCD9D0] hover:border-[#141413]'
            }`}
          >
            {sim.useTestVideoStream ? '动态视频背景：开启（推荐对比）' : '开启循环动态视频验证透出效果'}
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeA11y({ ...a11y, reduceTransparency: !a11y.reduceTransparency })
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              a11y.reduceTransparency
                ? 'bg-[#141413] text-white border-[#141413]'
                : 'bg-white text-[#4A4A47] border-[#DCD9D0] hover:border-[#141413]'
            }`}
          >
            减少透明度：{a11y.reduceTransparency ? '开' : '关'}
          </button>
          <button
            type="button"
            onClick={() =>
              onChangeA11y({ ...a11y, increaseContrast: !a11y.increaseContrast })
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              a11y.increaseContrast
                ? 'bg-[#141413] text-white border-[#141413]'
                : 'bg-white text-[#4A4A47] border-[#DCD9D0] hover:border-[#141413]'
            }`}
          >
            增强对比度：{a11y.increaseContrast ? '开' : '关'}
          </button>
          <button
            type="button"
            onClick={() => onChangeA11y({ ...a11y, reduceMotion: !a11y.reduceMotion })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              a11y.reduceMotion
                ? 'bg-[#141413] text-white border-[#141413]'
                : 'bg-white text-[#4A4A47] border-[#DCD9D0] hover:border-[#141413]'
            }`}
          >
            减弱动态效果：{a11y.reduceMotion ? '开' : '关'}
          </button>
        </div>

        <div className="pt-2 border-t border-[#E6E4DC] flex flex-wrap items-center gap-1.5">
          {INSPECT_PHASES.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => sim.jumpToInspectPhase(st.id)}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors cursor-pointer ${
                sim.phase === st.id
                  ? 'bg-[#141413] text-white'
                  : 'bg-white border border-[#DCD9D0] text-[#4A4A47] hover:border-[#141413]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </section>

      {/* 4 Targeted Controls Comparison */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FOUR_TARGET_CONTROLS.map((item) => (
          <div
            key={item.name}
            className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] space-y-1.5"
          >
            <div className="text-[13px] font-bold text-[#141413]">{item.name}</div>
            <div className="text-[12px] text-[#6A6A66] leading-relaxed">
              <span className="font-semibold text-[#4A4A47]">原版：</span>
              {item.before}
            </div>
            <div className="text-[12px] text-[#141413] leading-relaxed">
              <span className="font-semibold text-[#2B3D30]">实验版：</span>
              {item.after}
            </div>
          </div>
        ))}
      </section>

      {/* Explicit Web vs SwiftUI Boundary */}
      <section className="p-5 rounded-xl bg-[#141413] text-[#F3F2EE]">
        <div className="font-mono-num text-[11px] text-[#C8F542]">
          WEB SIMULATION VS NATIVE SWIFTUI · 边界说明
        </div>
        <p className="text-[12px] text-[#B8BCC4] leading-relaxed mt-1.5 mb-3.5">
          浏览器无法真正实现 iOS 26 底层光栅折射采样，此处仅以低不透明度透镜 + 边缘高光 + 空间分层模拟空间关系；正式 SwiftUI 交付由 Codex 直接调用系统 API，不照搬 CSS 滤镜：
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead>
              <tr className="border-b border-white/15 text-[#9EA4AE]">
                <th className="py-2 pr-3 font-semibold">控件</th>
                <th className="py-2 pr-3 font-semibold">Web 模拟方式</th>
                <th className="py-2 font-semibold text-[#C8F542]">SwiftUI 原生实现</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {SWIFTUI_MAPPING.map((row) => (
                <tr key={row.role}>
                  <td className="py-2 pr-3 font-semibold text-white whitespace-nowrap">
                    {row.role}
                  </td>
                  <td className="py-2 pr-3 text-[#B8BCC4]">{row.webSim}</td>
                  <td className="py-2 font-mono-num text-[11px] text-[#E5E7EB]">
                    {row.swiftuiApi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
