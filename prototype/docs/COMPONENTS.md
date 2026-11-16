# COMPONENTS.md — Liquid Glass 与业务组件规格清单

> 本文档覆盖 `src/components/warm-performance/WarmGlass.tsx` 的 **6 个统一 Liquid Glass 设计系统原语**，以及分布于首页、详情页、播放器、档案页的**关键业务 UI 组件**，并给出对应的 SwiftUI 实现建议。

---

## 一、统一 Liquid Glass 原语（`src/components/warm-performance/WarmGlass.tsx`）

所有玻璃原语均不得在业务内容区（长列表文字正文、图片本体、实色 `#D44E24` 主按钮）滥用。

### 1. `GlassDock`
- **用途**：底部悬浮导航坞（首页/档案 3-Tab）、详情页与总结页底部全宽操作按钮承托容器。
- **Props**：继承 `React.HTMLAttributes<HTMLDivElement>` (`children`, `className`, `style`, `...rest`)
- **样式类与层次**：`.warm-lg-dock rounded-full p-1.5`，内部嵌套 `<div className="relative z-10">{children}</div>` 以隔离开 `::before` / `::after` 棱镜高光伪元素。
- **使用位置**：
  - `WarmAppShell.tsx`：3-Tab 主导航 (`今日` / `开练` / `档案`)，最大宽度 `348px`，含 `.warm-lg-active-pill` 物理弹簧选中透镜 (`layoutId="warm-nav-active-capsule"`)。
  - `WarmExerciseDetailView.tsx`：底部 `进入全屏跟练` 容器。
  - `WarmPlayerView.tsx` (`summary`)：底部 `收入个人训练档案` 容器。
- **SwiftUI 对应**：iOS 26 使用 `.glassEffect(.regular.interactive(), in: Capsule())`；iOS 18 兼容使用 `Capsule().fill(.ultraThinMaterial)` + `LinearGradient` 1px 描边 + 软投影。

### 2. `GlassButton`
- **用途**：带文字（可选前置/后置图标）的胶囊型光学玻璃操作按钮。
- **Props**：
  - `tone?: 'light' | 'dim'`（默认 `'light'`）
  - `elevated?: boolean`（默认 `false`）
  - 继承 `React.ButtonHTMLAttributes<HTMLButtonElement>`
- **变体表现**：
  - `tone="light"`（默认）：`.warm-lg-control.warm-lg-interactive`，文字 `#191D22`。用于「‹ 今日」「‹ 档案」「‹ 退出」（亮舞台）、「配重与休息」「改做恢复日」「重播 / 原声」、暂停/退出次按钮。
  - `tone="light" elevated={true}`：`.warm-lg-control-elevated.warm-lg-interactive`，文字 `#191D22`，浓霜暖白高可读层。用于降亮阶段底部的「我已就位，立即开始」「直接开始本动作」「提前结束休息 / 开始下一动作」。
  - `tone="dim"`：`.warm-lg-dim-control`，深烟熏半透 + 浅字 `#F9F7F3`。用于降亮阶段顶部「‹ 退出」、休息阶段「-15s」「+15s」。
- **交互态**：`active` 时缩放到 `0.96`（`170ms`）。

### 3. `GlassIconButton`
- **用途**：纯图标或单符号（`−` / `+`）圆形玻璃按钮，默认强制 `min-h-[40px] min-w-[40px]` 确保运动中单手拇指可命中。
- **Props**：同 `GlassButton` (`tone?: 'light' | 'dim'`, `elevated?: boolean`)。
- **使用位置**：
  - 首页设定抽屉关闭按钮 `X`
  - 动作详情顶部 `‹` / `›` 切动作按钮（首尾禁用 `disabled:opacity-30`）
  - 播放器右上角语音提示开关（关闭时 `opacity: 0.55`）
  - `setComplete` 面板内实做次数微调 `−` / `+`（`h-11 w-11`）

### 4. `GlassPanel`
- **用途**：承载信息、列表卡片、抽屉或辅控分组的非单按钮玻璃表面。
- **Props**：
  - `variant?: 'chip' | 'rest' | 'sheet' | 'control' | 'dim-control' | 'header'`（默认 `'chip'`）
  - 继承 `React.HTMLAttributes<HTMLDivElement>`
- **6 种 Variant 用途映射**：
  1. `chip` (`.warm-lg-chip`)：动作详情 3 栏节奏卡、首页顺延恢复卡、设定抽屉当前配重卡与恢复日空卡、档案页月历容器、档案详情备注/0组说明/跳过清单、总结页 0 组说明/跳过清单。
  2. `rest` (`.warm-lg-rest-card`)：休息阶段「下一个动作预告卡」、`setComplete` 组确认编辑悬浮面板。
  3. `sheet` (`.warm-lg-sheet`)：退出训练二次确认底部抽屉（以及首页设定抽屉）。
  4. `control` (`.warm-lg-control`)：动作详情页 `动作 01 / 04` 序号胶囊、亮舞台顶部状态胶囊与提示徽章、右缘竖向次数步进器容器、底部 `上一动作 / 暂停 / 跳过动作` 3 格辅控条。
  5. `dim-control` (`.warm-lg-dim-control`)：降亮舞台顶部状态胶囊、提示徽章与 `预览态` 标签。
  6. `header` (`.warm-lg-header-blur`)：滚动吸顶后的顶栏模糊底（`WarmTodayView` `scrollY > 180`、`WarmHistoryView` `scrollY > 8` 直接附加对应类）。

### 5. `GlassSegmentedControl<T>`
- **用途**：带物理弹簧滑动胶囊指示器（`layoutId`）的多选项分段切换器。
- **Props**：
  - `options: { id: T; label: React.ReactNode; icon?: React.ReactNode }[]`
  - `value: T`
  - `onChange: (value: T) => void`
  - `layoutId: string`
  - `reduceMotion?: boolean`
  - `contained?: boolean`（默认 `true`）
  - `className?: string`, `buttonClassName?: string`
- **两种模式**：
  - `contained={true}`：外层包裹 `.warm-lg-control rounded-full p-0.5`，选中态渲染 `.warm-lg-active-pill` 晶莹水滴透镜 + `#B83E18` 半粗体文字。用于档案页右上角 `记录 / 月历`。
  - `contained={false}`：无外框横向自由间距，选中项仍呈 `.warm-lg-active-pill` 浮动胶囊。用于档案页分类筛选 `全部 / 力量 / 有氧 / 恢复`。

### 6. `GlassOverlay`
- **用途**：全屏阻塞交互遮罩层。
- **Props**：
  - `variant?: 'pause' | 'scrim'`（默认 `'pause'`）
  - 继承 `React.HTMLAttributes<HTMLDivElement>`
- **两种形态**：
  - `pause`：`rgba(249, 247, 243, 0.92)` + `backdrop-blur-md` 暖白全屏居中暂停界面。
  - `scrim`：`bg-black/40 backdrop-blur-sm flex flex-col justify-end`，用于托举底部抽屉（退出确认、设定抽屉）。

---

## 二、业务复合组件清点（对应 SwiftUI View 拆分建议）

以下组件目前按页面内聚编写于各自视图文件，SwiftUI 工程化时建议抽离为独立子 View：

| 逻辑组件名称 | 所在源文件 | 关键属性与状态 | 视觉与行为说明 |
|---|---|---|---|
| **SolidOrangePrimaryCTA**（内联样式） | `WarmTodayView`, `WarmExerciseDetailView`, `WarmPlayerView` | 标签文本、图标、点击回调、禁用态 | **故意不玻璃化**：全实色 `#D44E24`，白字 `SemiBold`，顶部 `1px white(0.34)` 内高光与暖橙投影 `0 10px 24px -8px rgba(212,78,36,0.42)` |
| **WarmStickyHeader** | `WarmTodayView.tsx` | `scrollY > 180` | 滚动前呈渐变透明配 `配重设定` 玻璃按钮；滚动吸顶后切换 `.warm-lg-header-blur`，副标题切为课程名，右侧 morph 为橙色 `开始` 胶囊 |
| **HeroParallaxStage** | `WarmTodayView.tsx` | `scrollY`, `media`, `activePlate`, `reduceMotion` | 全幅摄影 + 视差位移（`0.26x`）+ `heroBottomScrim` 多段过渡 + Kicker/大标题/等宽参数 |
| **SetupBottomSheet** | `WarmTodayView.tsx` | `activePlate`, `PLATE_PRESETS`, `customRestSeconds`, `restAutoAdvance`, `postponedNote` | 配重片 2 列选择矩阵（选中 `#191D22`）+ 休息预设 4 列网格（选中 `#D44E24`）+ 自动推进切换条 + 顺延/保存并开练 |
| **WorkoutOptionGrid** | `WarmTodayView.tsx` | `WORKOUT_OPTIONS`, `planIndex`, `postponedNote` | 2×2 课程卡网格；选中态显示 `1.5px #D44E24` 描边与右上角 `Check` |
| **StageProgressSegments** | `WarmPlayerView.tsx` | `plan.exercises`, `exerciseIdx`, `isDimmedStage` | 顶部 N 等分 `2.5px` 节拍进度条（已完成橙、当前段深石墨或暖白、未完成弱透明） |
| **VerticalRepStepper** | `WarmPlayerView.tsx` | `repDraft`, `currentExercise.targetReps` | 右缘竖向玻璃胶囊，含 `44×44` `+`/`−` 按钮，中间数字可点击一键复位目标次数（偏离目标时变 `#B83E18`） |
| **UnilateralSidePill** | `WarmPlayerView.tsx` | `currentExercise.isUnilateral`, `currentSide` | 仅单侧动作显示；内嵌 `左侧 (进行中/✓)` / `右侧` 双胶囊，选中项高亮 `#D44E24` |
| **SetCompleteSheet** | `WarmPlayerView.tsx` | `latestLogged`, `setCompleteAutoSec`, `autoAdvancePaused` | `.warm-lg-rest-card` 容器，集成 `−/+` 实做次数修改、`轻松/正好/吃力` 3 选 1 芯片、自动倒数提醒及手动立即推进按钮 |
| **RestCountdownStage & NextCard** | `WarmPlayerView.tsx` | `restRemaining`, `restTargetTotal`, `actualRestElapsed`, `restWaitingManual`, `nextExerciseAfterRest` | `90px` `Outfit` 倒计时 + `2.5px` 细轨 + `GlassPanel(variant="rest")` 下一动作 16:9 预告卡 |
| **ArchiveHistoryRow** | `WarmHistoryView.tsx` | `HistorySessionRecord`, `isDemoData` | `.warm-lg-chip` 交互长卡（左 `4:3` 缩略图+时长角标、右日期/结局/`[本次]`标记/标题/容量比/配重） |
| **MonthlyCalendarCard** | `WarmHistoryView.tsx` | `records`, `NOV_CALENDAR_DAYS` | `GlassPanel(variant="chip")` 7 列日历格（完整=橙底、部分=软橙描边、0组=浅石底），高亮日期可点击进单次详情 |
