import React from 'react';
import { useWorkoutSimulator } from '../hooks/useWorkoutSimulator';
import { PHOTOGRAPHY_SPEC_NOTES, PolishedScreen } from './cinematic-polished/polishedMedia';

interface PolishedComparisonPanelProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  activeScreen: PolishedScreen;
  selectedHistoryId: string | null;
  inspectedExerciseIdx: number | null;
  onJumpScreen: (
    target:
      | 'today'
      | 'detail'
      | 'active'
      | 'next'
      | 'rest'
      | 'summary'
      | 'history'
      | 'history_detail'
  ) => void;
}

export const PolishedComparisonPanel: React.FC<PolishedComparisonPanelProps> = ({
  sim,
  activeScreen,
  selectedHistoryId,
  inspectedExerciseIdx,
  onJumpScreen,
}) => {
  const currentLocation =
    sim.phase !== 'today'
      ? `全屏播放器 · ${sim.phase}`
      : activeScreen === 'today' && inspectedExerciseIdx !== null
      ? `连续全屏动作详情 · 0${inspectedExerciseIdx + 1}`
      : activeScreen === 'today'
      ? '1. 今日首页'
      : selectedHistoryId
      ? '3b. 训练档案 · 单次实录明细'
      : '3. 训练档案';

  const quickButtons: {
    id:
      | 'today'
      | 'detail'
      | 'active'
      | 'next'
      | 'rest'
      | 'summary'
      | 'history'
      | 'history_detail';
    label: string;
    active: boolean;
  }[] = [
    {
      id: 'today',
      label: '1. 今日首页',
      active: sim.phase === 'today' && activeScreen === 'today' && inspectedExerciseIdx === null,
    },
    {
      id: 'detail',
      label: '① 首页 → 连续动作详情',
      active: sim.phase === 'today' && activeScreen === 'today' && inspectedExerciseIdx !== null,
    },
    {
      id: 'active',
      label: '② 详情 → 全屏跟练舞台',
      active: sim.phase === 'active',
    },
    {
      id: 'next',
      label: '③ 动作间切换过渡',
      active: sim.phase === 'nextTransition',
    },
    {
      id: 'rest',
      label: '④ 组间休息压暗聚焦',
      active: sim.phase === 'rest',
    },
    {
      id: 'summary',
      label: '⑤ 总结 → 收入档案',
      active: sim.phase === 'summary',
    },
    {
      id: 'history',
      label: '3. 训练档案',
      active: sim.phase === 'today' && activeScreen === 'history' && !selectedHistoryId,
    },
    {
      id: 'history_detail',
      label: '3b. 档案单次明细',
      active: sim.phase === 'today' && activeScreen === 'history' && selectedHistoryId !== null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E3DC] pb-5">
        <div>
          <div className="text-[11px] font-mono-num font-semibold tracking-wider text-[#8C3B2B]">
            ART DIRECTION POLISH · 构图留白 × 连续全屏详情 × 总结与档案统一精修
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#141413] mt-1">
            电影级构图、连续扩展转场与统一编辑式品质
          </h2>
          <p className="mt-1.5 text-sm text-[#4A4A47] leading-relaxed">
            保留暖炭黑（#11100F）/ 象牙白（#F2EDE4）/ 暮色居家摄影与全屏运动舞台，重点解决首页文字拥挤、动作详情弹窗割裂感，以及总结/档案/实录明细的工具表格感，并实装五段连续交互动态。
          </p>
        </div>

        <div className="rounded-xl bg-[#F3F2EE] px-3.5 py-2 text-right shrink-0">
          <div className="text-[10.5px] text-[#6E706A]">当前审阅状态</div>
          <div className="text-xs font-mono-num font-bold text-[#141413] mt-0.5">
            {currentLocation}
          </div>
        </div>
      </div>

      {/* 五组关键转场一键体验 */}
      <div>
        <div className="text-xs font-semibold text-[#141413] mb-2">
          五组动态与连续转场快捷测试（建议按 ①→②→③→④→⑤ 依次在手机框内点按体验）
        </div>
        <div className="flex flex-wrap gap-2">
          {quickButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => onJumpScreen(btn.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                btn.active
                  ? 'bg-[#141413] text-[#F2EDE4]'
                  : 'bg-[#F3F2EE] text-[#4A4A47] hover:bg-[#E7E5DC] hover:text-[#141413]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 统一摄影艺术指导规范 */}
      <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4">
        <div className="text-xs font-bold text-[#141413] mb-2.5">
          统一摄影艺术指导规范（8 个全套动作 × 4 门课程统一暮色居家实景）
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PHOTOGRAPHY_SPEC_NOTES.map((item) => (
            <div key={item.label} className="text-xs leading-relaxed">
              <span className="font-semibold text-[#8C3B2B]">{item.label}：</span>
              <span className="text-[#4A4A47]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 本轮三项核心精修对照 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4">
          <div className="text-xs font-bold text-[#141413]">一、首页构图与文字呼吸感（+ 滚动视差吸顶）</div>
          <p className="mt-1.5 text-xs text-[#5E5E59] leading-relaxed">
            <span className="font-semibold text-[#141413]">精修前：</span>
            Hero 画面中段堆满标题、两行说明、主次按钮和参数，把运动人物与环境光影挡住大半。
            <br />
            <span className="font-semibold text-[#8C3B2B]">精修后：</span>
            拉高 Hero 画幅至 505–545px，中段完全留白给人物主体；影像仅保留轻量标题，导语与「开始今日训练 / 配重与休息」自然落位地平线基座，并随页面上滑产生柔和视差与顶栏吸顶切换。
          </p>
        </div>

        <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4">
          <div className="text-xs font-bold text-[#141413]">二、动作详情改为连续全屏扩展（无弹窗黑边）</div>
          <p className="mt-1.5 text-xs text-[#5E5E59] leading-relaxed">
            <span className="font-semibold text-[#141413]">精修前：</span>
            底部传统抽屉弹窗上方留出 40% 模糊黑空间，且切入全屏播放器时界面断裂跳变。
            <br />
            <span className="font-semibold text-[#8C3B2B]">精修后：</span>
            点击首页动作进入独立连续详情页（上半部 54% 无边框全幅 9:16 影像，渐变融入节奏拆解与发力要点）；点「进入全屏跟练」通过共享 <code className="font-mono-num">layoutId</code> 将上半幅实景直接延展铺满全屏。
          </p>
        </div>

        <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4">
          <div className="text-xs font-bold text-[#141413]">三、训练总结 / 训练档案 / 单次明细品质统一</div>
          <p className="mt-1.5 text-xs text-[#5E5E59] leading-relaxed">
            <span className="font-semibold text-[#141413]">精修前：</span>
            总结与档案明细使用密集等宽数字表格与硬边框筛选块，偏「数据后台工具」气质。
            <br />
            <span className="font-semibold text-[#8C3B2B]">精修后：</span>
            全面采用 245–285px 余韵头图、大号雕塑感 <code className="font-display-b">Outfit</code> 核心数字、极简下划线筛选，并将逐组记录改为「第 1 轮 / 第 2 轮」编辑式分组编排。
          </p>
        </div>

        <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4">
          <div className="text-xs font-bold text-[#141413]">四、五组动态与连续转场</div>
          <p className="mt-1.5 text-xs text-[#5E5E59] leading-relaxed">
            <span className="font-semibold text-[#8C3B2B]">实操路径：</span>
            ① 首页上下滑动看 Hero 视差吸顶；② 点动作卡进入连续详情并左右切动作；③ 点「进入全屏跟练」由半幅实景延展满屏；④ 全屏中按「完成本组」体验动作间交叉溶入与房间暗场休息；⑤ 训练结束「收入个人训练档案」查看刚记录的 16:10 卡片与轮次明细。
          </p>
        </div>
      </div>
    </div>
  );
};
