import React from 'react';
import { useWorkoutSimulator } from '../hooks/useWorkoutSimulator';
import { CinematicScreen } from './cinematic/cinematicMedia';

interface CinematicSpecPanelProps {
  sim: ReturnType<typeof useWorkoutSimulator>;
  activeScreen: CinematicScreen;
  selectedHistoryId: string | null;
  onJumpScreen: (
    target: 'today' | 'active' | 'rest' | 'history' | 'history_detail'
  ) => void;
}

export const CinematicSpecPanel: React.FC<CinematicSpecPanelProps> = ({
  sim,
  activeScreen,
  selectedHistoryId,
  onJumpScreen,
}) => {
  const currentLocation =
    sim.phase !== 'today'
      ? `2. 全屏运动播放器 · ${sim.phase}`
      : activeScreen === 'today'
      ? '1. 今天 · 沉浸式训练首页'
      : selectedHistoryId
      ? '3b. 训练档案 · 单次逐组实录详情'
      : '3. 训练历史 · 影像训练档案';

  const quickButtons: {
    id: 'today' | 'active' | 'rest' | 'history' | 'history_detail';
    label: string;
    active: boolean;
  }[] = [
    {
      id: 'today',
      label: '1. 今天（全幅海报 Hero）',
      active: sim.phase === 'today' && activeScreen === 'today',
    },
    {
      id: 'active',
      label: '2. 训练进行中（全屏播放器）',
      active: sim.phase === 'active',
    },
    {
      id: 'rest',
      label: '2b. 组间休息（静谧倒数幕）',
      active: sim.phase === 'rest',
    },
    {
      id: 'history',
      label: '3. 训练历史（影像训练档案）',
      active: sim.phase === 'today' && activeScreen === 'history' && !selectedHistoryId,
    },
    {
      id: 'history_detail',
      label: '3b. 档案单次剧照详情',
      active: sim.phase === 'today' && activeScreen === 'history' && selectedHistoryId !== null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E3DC] pb-5">
        <div>
          <div className="text-[11px] font-mono-num font-semibold tracking-wider text-[#8C3B2B]">
            CINEMATIC FITNESS · 新视觉方向独立原型
          </div>
          <h2 className="font-display-a text-[30px] font-bold tracking-tight text-[#141413] leading-tight mt-1">
            电影级沉浸式训练体验（内容优先 · 界面退后）
          </h2>
          <p className="mt-1.5 text-sm text-[#4A4A47] leading-relaxed">
            告别黑底＋荧光绿＋圆角卡片墙。以 35mm 暖黑摄影剧照作为整套 APP 的主视觉语言，仅保留本轮指定的三大核心页面（今天、训练进行中、训练历史），旧版 Phase 1 与 B1.5 基线完整保留于上方模式栏方便随时对比。
          </p>
        </div>

        <div className="rounded-xl bg-[#F3F2EE] px-3.5 py-2 text-right shrink-0">
          <div className="text-[10.5px] text-[#6E706A]">当前审阅页面</div>
          <div className="text-xs font-mono-num font-bold text-[#141413] mt-0.5">
            {currentLocation}
          </div>
        </div>
      </div>

      {/* 快速切页 */}
      <div>
        <div className="text-xs font-semibold text-[#141413] mb-2.5">快速跳转本轮三页原型</div>
        <div className="flex flex-wrap gap-2">
          {quickButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => onJumpScreen(btn.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                btn.active
                  ? 'bg-[#141413] text-[#F4EFE6]'
                  : 'bg-[#F3F2EE] text-[#4A4A47] hover:bg-[#E7E5DC] hover:text-[#141413]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 视觉系统核心变革 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4">
          <div className="text-xs font-bold text-[#141413]">色彩重构（去荧光绿 · 避红黑套路）</div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-[#0B0908] border border-black/15" title="#0B0908 暖黑幕布" />
            <span className="w-5 h-5 rounded-md bg-[#14110F]" title="#14110F 烟熏岩板" />
            <span className="w-5 h-5 rounded-md bg-[#F4EFE6] border border-black/15" title="#F4EFE6 暖象牙主触发" />
            <span className="w-5 h-5 rounded-md bg-[#BA4832]" title="#BA4832 氧化赤陶强调" />
            <span className="w-5 h-5 rounded-md bg-[#D9BE94]" title="#D9BE94 香槟金标注" />
          </div>
          <p className="mt-2.5 text-xs text-[#4A4A47] leading-relaxed">
            以暖黑幕布 `#0B0908` 为基底，主播放/完成按键改用高反差暖象牙白 `#F4EFE6`，辅以克制的香槟金 `#D9BE94` 与氧化赤陶 `#BA4832`，摆脱廉价霓虹感。
          </p>
        </div>

        <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4">
          <div className="text-xs font-bold text-[#141413]">排版与影像比例</div>
          <ul className="mt-2 space-y-1.5 text-xs text-[#4A4A47] leading-relaxed">
            <li>• 首页 70% 全幅电影海报 Hero（9:16 贯通刘海安全区）</li>
            <li>• 动作分镜与档案列表采用 16:9 宽银幕横幅缩略图</li>
            <li>• 电影标题体 Barlow Condensed + 等宽计时 JetBrains Mono</li>
            <li>• 配重片组合与休息参数收拢于底部制作抽屉，保持首屏纯粹</li>
          </ul>
        </div>

        <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4">
          <div className="text-xs font-bold text-[#141413]">SwiftUI 原生实现可行性</div>
          <ul className="mt-2 space-y-1.5 text-xs text-[#4A4A47] leading-relaxed">
            <li>• 全幅 Hero：`.ignoresSafeArea(.edges: .top)` + `LinearGradient` 多段暗角</li>
            <li>• 播放器：`AVPlayerLayer` 铺满 + `.ultraThinMaterial` 极轻悬浮控件</li>
            <li>• 数字防抖：大号倒计时使用 `.monospacedDigit()`</li>
            <li>• 无复杂 SVG 滤镜，纯原生视图层级即可 1:1 落地</li>
          </ul>
        </div>
      </div>

      {/* 三大页面亮点说明 */}
      <div className="rounded-xl bg-[#FAF9F6] border border-[#E5E3DC] p-4 space-y-2 text-xs text-[#4A4A47] leading-relaxed">
        <div>
          <span className="font-bold text-[#141413]">1. 今天（沉浸式首页）：</span>
          打开即见电影主海报、导演级暖色暗角与「开始今日训练」纯象牙白主按钮；横向 16:9 片单卡切换课程时，主海报实时交叉淡入；下方以分镜表形式列出 4 个动作的实拍参考、目标次数与片重。
        </div>
        <div>
          <span className="font-bold text-[#141413]">2. 训练进行中（全屏播放器）：</span>
          进入训练自动隐藏底部导航。保持动作画面 100% 锐利无模糊，右缘轻盈半透次数标尺与顶部章节进度条协同；组间休息时退为静谧暖黑大数字倒数与「下一幕」宽银幕预告。
        </div>
        <div>
          <span className="font-bold text-[#141413]">3. 训练历史（影像训练档案）：</span>
          首条入档以 16:9 宽幅重点展示，往期按剧照缩略图 + 实录时间码排列；「0 组提前结束」主动褪色标明且绝不计入完成次数，点入详情可逐组回看重量、次数与主观难度。
        </div>
      </div>
    </div>
  );
};
