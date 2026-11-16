import React from 'react';
import { MainAppTab } from '../data/appRecords';
import { useWorkoutSimulator } from '../hooks/useWorkoutSimulator';
import { LiquidGlassA11yConfig } from './liquid/LiquidGlassPrimitives';
import { Phase2ModuleId } from './app/TodayOverviewView';

interface Phase1SpecPanelProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  activeTab: MainAppTab;
  showTodaySetup: boolean;
  selectedHistoryId: string | null;
  phase2Subpage: Phase2ModuleId | null;
  a11y: LiquidGlassA11yConfig;
  onChangeA11y: (next: LiquidGlassA11yConfig) => void;
  onJumpScreen: (screen: 'overview' | 'plan' | 'history' | 'history_detail' | 'today_setup' | 'active_player' | 'phase2_body') => void;
}

export const Phase1SpecPanel: React.FC<Phase1SpecPanelProps> = ({
  sim,
  activeTab,
  showTodaySetup,
  selectedHistoryId,
  phase2Subpage,
  a11y,
  onChangeA11y,
  onJumpScreen,
}) => {
  const currentLocationLabel =
    sim.phase !== 'today'
      ? `沉浸跟练舞台 · ${sim.phase}`
      : showTodaySetup
      ? '二级页 · 今日配重与循环明细'
      : phase2Subpage
      ? `第二阶段占位 · ${phase2Subpage}`
      : activeTab === 'overview'
      ? 'Tab 1 · 训练总览'
      : activeTab === 'plan'
      ? 'Tab 2 · 弹性训练计划'
      : activeTab === 'history'
      ? selectedHistoryId
        ? 'Tab 3 · 单次训练实录详情'
        : 'Tab 3 · 训练历史'
      : 'Tab 4 · 身体（第二阶段占位）';

  const quickNavItems: {
    id: 'overview' | 'plan' | 'history' | 'history_detail' | 'today_setup' | 'active_player' | 'phase2_body';
    label: string;
    active: boolean;
  }[] = [
    {
      id: 'overview',
      label: '1. 训练总览（今天）',
      active: sim.phase === 'today' && !showTodaySetup && !phase2Subpage && activeTab === 'overview',
    },
    {
      id: 'plan',
      label: '2. 弹性训练计划',
      active: sim.phase === 'today' && !showTodaySetup && !phase2Subpage && activeTab === 'plan',
    },
    {
      id: 'history',
      label: '3. 训练历史（时间线/月历）',
      active:
        sim.phase === 'today' &&
        !showTodaySetup &&
        !phase2Subpage &&
        activeTab === 'history' &&
        !selectedHistoryId,
    },
    {
      id: 'history_detail',
      label: '3b. 历史单次实录详情',
      active:
        sim.phase === 'today' &&
        !showTodaySetup &&
        !phase2Subpage &&
        activeTab === 'history' &&
        selectedHistoryId !== null,
    },
    {
      id: 'today_setup',
      label: '二级 · 配重与动作明细',
      active: sim.phase === 'today' && showTodaySetup,
    },
    {
      id: 'active_player',
      label: '沉浸 · 训练进行中（Liquid Glass）',
      active: sim.phase === 'active',
    },
    {
      id: 'phase2_body',
      label: '占位 · 身体（第二阶段入口）',
      active: sim.phase === 'today' && !showTodaySetup && activeTab === 'body',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E3DC] pb-5">
        <div>
          <div className="text-[11px] font-mono-num font-semibold tracking-wider text-[#5E5E59]">
            PHASE 1 · 整套 APP 视觉系统与核心信息架构
          </div>
          <h2 className="font-display-b text-2xl font-extrabold tracking-tight text-[#141413] mt-1">
            第一阶段交付：总览 · 弹性计划 · 历史 + 已定版播放器
          </h2>
          <p className="mt-1.5 text-sm text-[#4A4A47] leading-relaxed">
            建立统一 4 标签悬浮 Liquid Glass 导航栏（今天 / 计划 / 记录 / 身体），完整设计三大核心主页面并与 B1.5 训练播放器闭环联动；其余 4 个模块仅保留诚实入口占位，等待本轮评审确认后再进入第二阶段。
          </p>
        </div>

        <div className="rounded-xl bg-[#F3F2EE] px-3.5 py-2 text-right shrink-0">
          <div className="text-[10.5px] text-[#6E706A]">当前预览位置</div>
          <div className="text-xs font-mono-num font-bold text-[#141413] mt-0.5">
            {currentLocationLabel}
          </div>
        </div>
      </div>

      {/* 快速直达视图 */}
      <div>
        <div className="text-xs font-semibold text-[#141413] mb-2.5">快速跳转审阅页面</div>
        <div className="flex flex-wrap gap-2">
          {quickNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onJumpScreen(item.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                item.active
                  ? 'bg-[#141413] text-[#C8F542]'
                  : 'bg-[#F3F2EE] text-[#4A4A47] hover:bg-[#E7E5DC] hover:text-[#141413]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 三大核心页面结构说明 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4">
          <div className="text-xs font-bold text-[#141413]">1. 训练总览（今天 Tab）</div>
          <ul className="mt-2 space-y-1.5 text-xs text-[#4A4A47] leading-relaxed">
            <li>• 单一视觉焦点：今日推荐训练大图 + 实色「开始今日训练」直达</li>
            <li>• 次级玻璃胶囊「配重 / 明细」直通 B1.5 配重与动作明细页</li>
            <li>• 极简节律线展示本周力量/有氧次数，不绑固定星期几</li>
            <li>• 身体趋势摘要标注「手动记录示例」，零虚假分数</li>
          </ul>
        </div>

        <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4">
          <div className="text-xs font-bold text-[#141413]">2. 弹性训练计划（计划 Tab）</div>
          <ul className="mt-2 space-y-1.5 text-xs text-[#4A4A47] leading-relaxed">
            <li>• 三档主观恢复体感（状态充沛 / 正常负荷 / 略感疲惫），严禁虚构百分比</li>
            <li>• 选「略感疲惫」自动切换恢复优先建议，不制造连续打卡负罪感</li>
            <li>• 支持顺位上下调序、替换课程（含恢复日）、主动顺延及调整日志</li>
            <li>• 一键「设为今日训练并配置」联动更新播放器课程</li>
          </ul>
        </div>

        <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4">
          <div className="text-xs font-bold text-[#141413]">3. 训练历史（记录 Tab）</div>
          <ul className="mt-2 space-y-1.5 text-xs text-[#4A4A47] leading-relaxed">
            <li>• 支持时间线与 11 月历视图切换，力量 / 有氧 / 恢复分类筛选</li>
            <li>• 严格区分「完整完成」「部分完成」「提前结束（0组·不计次数）」</li>
            <li>• 点入任意记录可看逐组重量、实际/目标次数、实休秒数与主观难度</li>
            <li>• 在播放器完成或提前退出后，自动将「本次实录」写入记录列表</li>
          </ul>
        </div>
      </div>

      {/* Liquid Glass 克制克度与无障碍测试 */}
      <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-[#141413]">
            Liquid Glass 克制使用准则 & iOS 辅助功能测试
          </div>
          <p className="text-xs text-[#5E5E59] leading-relaxed">
            仅用于「悬浮底部 4-Tab 栏」「总览大图次级明细键」与「训练进行中 4 组悬浮控件」；列表行、主行动按钮（#C8F542）与纯深色页面坚决不做伪玻璃。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {(
            [
              { key: 'reduceTransparency', label: '降低透明度' },
              { key: 'increaseContrast', label: '增强对比度' },
              { key: 'reduceMotion', label: '减弱动态效果' },
            ] as { key: keyof LiquidGlassA11yConfig; label: string }[]
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChangeA11y({ ...a11y, [opt.key]: !a11y[opt.key] })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                a11y[opt.key]
                  ? 'bg-[#141413] text-white border-[#141413]'
                  : 'bg-white text-[#4A4A47] border-[#DCD9D0] hover:border-[#141413]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 本阶段数据边界说明 */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 leading-relaxed">
        <span className="font-bold">真实功能 vs 演示数据边界：</span>
        本周训练节律、历史列表初始 5 条样本及身体趋势数值（74.5kg / 81.5cm）均已标注为演示/手动示例；在右侧手机原型中实际完成一组或提前结束训练后，会自动追加一条标记为「本次实录」的真实会话至记录页与总览最近一次记录。第二阶段（身体数据与照片对比 / 哑铃配重库存管理 / NAS 课程库 / 设置）目前仅展示规划占位页。
      </div>
    </div>
  );
};
