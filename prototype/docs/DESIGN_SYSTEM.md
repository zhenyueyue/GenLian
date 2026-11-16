# DESIGN_SYSTEM.md — Warm Performance（暖光运动）× Liquid Glass 设计规范

> **状态**：设计基线已冻结（Design Baseline Frozen）。  
> **适用范围**：`跟练（GenLian）` 正式 iPhone 原生 SwiftUI 开发视觉基线。本文档所有 Token、数值与材质参数均直接对齐仓库源码中的 `src/components/warm-performance/warmTokens.ts`、`src/components/warm-performance/WarmGlass.tsx` 与 `src/index.css`。

---

## 1. 设计哲学与视觉比例（60 / 30 / 10）

- **品牌主题**：Warm Performance（暖光运动）——以温暖明亮的晨光居家摄影与矿物纸画布为基底，结合克制的等宽数字排版与 iOS 26 Liquid Glass 悬浮光学控件，实现高专注、无游戏化噪点的私人跟练体验。
- **三色结构比例**：
  - **60% 主画布**：`#F9F7F3`（暖白矿物纸，非纯白 `#FFFFFF`，降低晨间强对比刺眼感）。
  - **30% 结构表面**：`#F1EFE8`（浅石灰岩）与轻量抬升层 `#E6E2D8`、`#EAE5DC`、`#FFFFFF`，保持柔和明度差（约 3.2%–4.5%），避免厚重卡片边框堆叠。
  - **10% 唯一品牌强调色**：`#D44E24`（暖光运动橙），专用于高意向主行动按钮（开始训练、完成本动作、继续跟练、收入档案）、已完成进度段与激活节点。

---

## 2. 色彩规范（Color Tokens）

### 2.1 画布、表面与分割线

| Token 名称 | Hex / RGBA | 用途说明 | SwiftUI 映射建议 |
|---|---|---|---|
| `canvasBg` | `#F9F7F3` | 首页、档案、单次详情、动作详情、总结页主画布底色 | `Color(hex: 0xF9F7F3)` |
| `surfaceBg` | `#F1EFE8` | Hero 占位、次级卡片底色、课程切换默认卡底 | `Color(hex: 0xF1EFE8)` |
| `surfaceElevatedBg` | `#E6E2D8` | 次级抬升表面、0 组退出日历底色 | `Color(hex: 0xE6E2D8)` |
| `surfaceBackdropStudio` | `#EAE5DC` | 全屏播放器、详情图容器、`object-contain` 留白舞台底色 | `Color(hex: 0xEAE5DC)` |
| `surfaceWhiteLift` | `#FFFFFF` | 选中状态卡片抬升面 | `.white` |
| `hairlineBorder` | `rgba(25, 29, 34, 0.085)` | 动作列表分隔线、统计指标带上下细线、抽屉表头分割 | `Color(hex: 0x191D22).opacity(0.085)` |
| `hairlineStrong` | `rgba(25, 29, 34, 0.14)` | 抽屉顶部拖拽指示条（Handle） | `Color(hex: 0x191D22).opacity(0.14)` |

### 2.2 文本层级（Ink Hierarchy）

| Token 名称 | Hex / RGBA | 对比度（于 `#F9F7F3`） | 用途 |
|---|---|---|---|
| `inkPrimary` | `#191D22` | ~15.8:1 | 中文主标题、动作名称、主要数值、轻底玻璃控件文字 |
| `inkSecondary` | `#4D545E` | ~7.1:1 | 动作要领正文、肌群描述、副标题、未选中分段选项 |
| `inkMuted` | `#686F7A` | ~4.7:1 | 弱化注记、时间戳单位、未打卡日历日期 |
| `auxSlate` | `#415A72` | ~6.6:1 | 克制辅助冷色：休息设定值、单侧标记、主观感受标签、暂停提示 |
| `warning` | `#B86214` | ~4.1:1 | 承重安全警示、部分完成与跳过动作状态标题 |

### 2.3 品牌强调与按钮锚点

| Token 名称 | Hex / RGBA | 用途 |
|---|---|---|
| `accent` | `#D44E24` | 主行动实色按钮背景（CTA）、进度完成线、月历完整打卡日 |
| `accentHover` | `#BF421B` | 主按钮按下/悬停态 |
| `accentTextOnLight` | `#B83E18` | `12px–13px` 小号强调文字在 `#F9F7F3` 上的 WCAG AA 校准色（~5.6:1） |
| `accentSoft` | `rgba(212, 78, 36, 0.10)` | 淡橙软底（部分完成状态或图标光晕背景） |
| `accentContrastText` | `#FFFFFF` | `#D44E24` 实色按钮上的纯白文字 |
| `graphiteCtaBg` | `#191D22` | 选中装片/主观感受胶囊、返回/继续训练石墨实色按钮 |
| `graphiteCtaText` | `#F9F7F3` | 石墨实色按钮文字 |

### 2.4 降亮舞台阶段专色（Prepare / Rest / NextTransition / SetComplete）

| Token 名称 | 值 | 用途 |
|---|---|---|
| `restDimFilterClass` | `brightness(0.72) saturate(0.82) scale(1.015)` | 组间休息时舞台背景温和降亮，保留居家环境可见度 |
| `restDimVeilClass` | `rgba(31, 36, 43, 0.32)` | 石板暮纱遮罩（`500ms` 渐入，避免黑屏压抑） |
| `restTextPrimary` | `#F9F7F3` | 降亮舞台大号倒计时、动作标题与烟熏玻璃按钮文字 |
| `restTextSecondary` | `#EEF1F4` | 降亮舞台实休标注与准备提示正文 |
| `restAccentText` | `#FF9E7D` | 降亮舞台上的暖橙阶段标签、最后 3 秒倒计时高亮 |
| `restProgressTrack` | `rgba(249, 247, 243, 0.28)` | 休息阶段 2.5px 水平进度轨底色 |

---

## 3. 摄影光学调色与可读性保护层（Scrims）

- **晨光摄影统一滤镜（`photoFilterClass`）**：`brightness(1.01) contrast(1.03) saturate(0.94) hue-rotate(-2deg)` + 极浅冷空气薄膜 `photoCoolAirTintClass`（`rgba(242, 246, 250, 0.06)`），消除家居照片偏黄混浊感。
- **首页 Hero 顶部/底部渐变**：
  - 顶部渐层：`180deg`, `rgba(249,247,243,0.58)` → `0`（保证状态栏与顶部标题可读）。
  - 底部渐层（`heroBottomScrim`）：`44%` 起从透明过渡至 `rgba(249,247,243,0.72)` (72%) → `rgba(249,247,243,0.96)` (88%) → `#F9F7F3` (100%)。
- **播放器激活舞台渐变**：
  - 顶部 `144px` 渐层：`rgba(249,247,243,0.58)` → `0`（降亮阶段切换为深色 `rgba(25,29,34,0.34)` → `0`）。
  - 底部 `37%`（SE `40%`）渐层：`rgba(249,247,243,0)` → `rgba(249,247,243,0.92)`（确保明亮窗光下底部 12px 参数小字对比度稳定 ≥ 7:1）。

---

## 4. 字体排版规范（Typography）

### 4.1 字体家族映射

| 语义角色 | Web 原型字体栈 | iOS 原生 SwiftUI 建议 | 特性要求 |
|---|---|---|---|
| **超大数字与度量** (`.font-display-b`) | `'Outfit', 'PingFang SC', 'Noto Sans SC', sans-serif` | `.system(..., design: .rounded)` 或内嵌 `Outfit` | 强制开启 `font-variant-numeric: tabular-nums`（SwiftUI `.monospacedDigit()`） |
| **标题与 UI 正文** | `'Plus Jakarta Sans', 'PingFang SC', 'Noto Sans SC', -apple-system, sans-serif` | SF Pro Display / Text + PingFang SC（或内嵌 `Plus Jakarta Sans`） | 中文优先清晰锐利 |
| **技术时间码 / 节奏 / 配重** (`.font-mono-num`) | `'JetBrains Mono', ui-monospace, SFMono-Regular, monospace` | `.monospaced()` / `SF Mono` + `.monospacedDigit()` | 保证时间码 `00:48`、节奏 `3-1-1` 不抖动 |

### 4.2 字号与字重阶梯

| 层级 | 字号（Standard / ProMax） | SE 小屏适配 | 字重 | 行高 / 字距 | 示例 |
|---|---|---|---|---|---|
| 休息/准备超大倒计时 | `90px` (Rest) / `88px` (Prepare) | `74px` | `600 SemiBold` | `leading-none`, `-0.03em` | `01:28` / `4` |
| 切动作倒计时 | `54px` | `54px` | `600 SemiBold` | `leading-none` | `2` |
| 统计核心度量数字 | `32px` (详情/总结) / `28px` (档案) | 同左 | `600 SemiBold` | `leading-none`, `tabular-nums` | `16` / `06:24` |
| 首页 Hero 主标题 | `31px` | `26px` | `600 SemiBold` | `1.14`, `-0.025em` | `全身均衡循环` |
| 页面与详情主标题 | `26px` (档案/详情/完成) | `23px` (动作详情) | `600 SemiBold` | `1.16–1.18`, `-0.02em` | `哑铃地板卧推` |
| 进行中动作标题 | `25px` | `22px` | `600 SemiBold` | `1.18` | `高脚杯哑铃深蹲` |
| 步进器 / 节奏卡数字 | `26px–28px` (次数) / `20px` (节奏秒) | 同左 | `600 SemiBold` | `leading-none` | `12` / `3s` |
| 章节与动作列表标题 | `15.5px–16px` / `15px` (列表次项) | 同左 | `600 SemiBold` | `1.35` | `今日动作顺序` |
| 主 CTA 按钮文字 | `14.5px–15px` | 同左 | `600 SemiBold` | `leading-none` | `开始今日训练` |
| 动作提示 / 正文说明 | `13px` | 同左 | `400 Regular` | `1.58–1.60` | `大臂呈 45 度缓慢下放…` |
| 微标签 / Kicker / 数据标注 | `11.5px–12.5px` | 同左 | `500–600` | `1.45` | `01 · 胸` / `3-1-1` |

---

## 5. 间距、圆角、阴影与安全区

- **设备断点基准**（对应 `IPhoneFrame.tsx`）：
  - `promax`: `412 × 886` 逻辑渲染框（对应 `430 × 932 pt` 实机），Dynamic Island
  - `standard`: `390 × 844`（对应 `393 × 852 pt` 实机），Dynamic Island
  - `se`: `375 × 690`（对应 `375 × 667 pt` 小屏），无 Dynamic Island，安全区缩减
- **安全区内边距**：
  - 顶部：`SE` 为 `pt-[32px]` / `pt-[34px]`；`Standard/ProMax` 为 `pt-[50px]`（对应 SwiftUI 顶部自动 safe area + 适度呼吸）。
  - 底部：统一采用 `calc(base + env(safe-area-inset-bottom, 0px))`（`base` 为 `12px–28px`），确保不遮挡 Home Indicator。
- **页面水平边距**：主页面标准 `px-5`（`20pt`）；全屏播放器操作区 `px-4`（`16pt`）。
- **圆角标准**：
  - 胶囊操作按钮 / 悬浮 Dock / 分段器：`9999px` (`rounded-full` / `Capsule()`)
  - 底部抽屉顶部：`24px` (`rounded-t-3xl`)
  - 档案卡 / 休息预告卡 / 月历容器：`16px` (`rounded-2xl`)
  - 节奏子卡 / 配重选择芯片 / 主图：`12px` (`rounded-xl`)
  - 列表缩略图：`8px` (`rounded-lg`)

---

## 6. Liquid Glass 分层光学材质规范（iOS 26 基准）

本系统**严禁把整页做成玻璃**，仅对「悬浮导航 Dock、悬浮按钮、信息卡/芯片、滚动顶栏、底部抽屉、休息预告与组间面板」应用多层光学玻璃；内容流与实色 `#D44E24` 主按钮保持清晰分离。

### 6.1 六类玻璃变体参数（精确对齐 `src/index.css`）

| CSS 类名 | 使用场景 | 填充渐变 (Tint) | 背景模糊与采样 | 高光边框 (`::before`) 与阴影 |
|---|---|---|---|---|
| `.warm-lg-dock` | 底部悬浮 3-Tab 导航栏、详情/总结页单按钮 Dock | 180° 白透暖霜：`0.40 → 0.24 → 0.36` | `blur(13px) saturate(205%) contrast(1.04) brightness(1.12)` | `1.25px` 冷暖双色棱镜描边（含 `#E4F4FF` 与 `#FFEEDC` 折光）；`::after` 穹顶镜面光泽；`inset 0 2px 5px white(0.82)` + `0 14px 36px -10px ink(0.16)` |
| `.warm-lg-active-pill` | Dock 选中水滴透镜、分段开关选中滑块 | 180° 晶莹白：`0.88 → 0.56 → 0.74` | 无独立模糊（叠加于 Dock 之上） | 顶 `1.5px` 纯白高光 + 底 `1px` `ink(0.05)` 微凹；`0 4px 12px -2px ink(0.12)` |
| `.warm-lg-control` | 亮舞台顶部按钮/状态胶囊、配重设定按钮、步进器容器、底部 3 控条、视频辅控 | 172° 清透玻璃：`0.34 → 0.18 → 0.30` | `blur(14px) saturate(200%) contrast(1.05) brightness(1.04)` | `1px` 折射高光边（白 + `#E8F4FF`）；`0 8px 22px -6px ink(0.15)` |
| `.warm-lg-control-elevated` | Prepare / Rest / NextTransition 底部主要玻璃动作按钮（高可读优先级） | 165° 浓霜暖白：`0.80 → 0.68` | `blur(22px) saturate(175%) brightness(1.04)` | `1px` 高光描边；`0 10px 26px -8px ink(0.24)` |
| `.warm-lg-dim-control` | 降亮舞台 (`rest` / `prepare` / `nextTransition` / `setComplete`) 顶部按钮、胶囊与 `-15s/+15s` | 168° **深烟熏半透**：`rgba(24,28,34,0.44) → rgba(20,24,30,0.30) → rgba(28,33,40,0.40)` | `blur(16px) saturate(185%) brightness(0.96)` | `1px` 顶强底弱白边 (`0.82 → 0.06 → 0.46`)；配 `#F9F7F3` 文字保证在阳光白墙照下仍 ≥ 7:1 |
| `.warm-lg-chip` | 档案列表卡片、月历容器、动作节奏拆解卡、备注/跳过/零组卡片、抽屉内非选中片 | 165° 轻量暖白玻璃：`0.58 → 0.44` | `blur(18px) saturate(165%)` | `0.75px` 细折光边；`0 4px 14px -4px ink(0.10)` |
| `.warm-lg-rest-card` | 休息阶段下一动作预告卡、`setComplete` 确认编辑卡片 | 165° 亮雾玻璃：`0.72 → 0.58` | `blur(22px) saturate(170%) brightness(1.06)` | `1px` 亮白高光边；`0 18px 40px -12px rgba(15,18,22,0.26)` |
| `.warm-lg-header-blur` | 首页 `scrollY > 180` 吸顶栏、档案页 `scrollY > 8` 吸顶筛选栏 | 180° 顶部暖霜：`0.68 → 0.54` | `blur(22px) saturate(175%)` | 底部 `1px` 细分割线 + `0 8px 24px -10px ink(0.09)` |
| `.warm-lg-sheet` | 配重与休息设定抽屉、退出确认抽屉 | 180° 实感磨砂：`0.84 → 0.92` | `blur(24px) saturate(165%)` | 顶部 `1px rgba(255,255,255,0.82)`；上向柔影 `0 -14px 40px -12px ink(0.16)` |

### 6.2 三类背景对比度与可读性验证矩阵

| 背景类型 | 应用组件 | 可读性保护手段 |
|---|---|---|
| **明亮居家摄影**（日光白墙/窗光） | `.warm-lg-control`, `.warm-lg-dim-control`, 播放器上下数据 | 激活期用顶部/底部暖白渐变 Scrim 托底；进入降亮舞台后按钮切换为**深烟熏玻璃 `.warm-lg-dim-control`** 搭配 `#F9F7F3` 浅字，防止浅白玻璃融进阳光墙面 |
| **深色缩略图 / 滚动暗部** | `.warm-lg-dock`, `.warm-lg-rest-card` | Dock 中段暖白透明度保留 `0.24`–`0.40` 并叠加 `brightness(1.12)`，保证未激活项 `rgba(25,29,34,0.72)` 深色文字与图标始终清晰可读 |
| **纯色画布 `#F9F7F3`** | `.warm-lg-chip`, `.warm-lg-header-blur`, `.warm-lg-sheet` | 档案页底层加入极微弱 `opacity-[0.08]` 模糊光影层与 `0.75px` 高光描边，使卡片在纯画布上保留轻透玻璃分层而不融化 |

### 6.3 降级与无障碍支持（Accessibility）

- **不支持 `backdrop-filter`**：常规暖白玻璃降级为 `rgba(249, 247, 243, 0.95)`；烟熏玻璃降级为 `rgba(38, 43, 50, 0.86)`。
- **减弱透明度（`prefers-reduced-transparency: reduce` / App 开关 `.lg-a11y-reduce-transparency`）**：移除 `backdrop-filter`，普通玻璃变为 `rgba(249, 247, 243, 0.96)`，烟熏玻璃变为 `rgba(34, 39, 46, 0.88)`，隐藏 `.warm-lg-dock::after` 光泽层。
- **增强对比度（`.lg-a11y-increase-contrast`）**：加重 `1px` 描边至 `ink(0.24)` / `white(0.56)` 并提高背板不透明度。

---

## 7. 动效规范（Motion Spec）

| 交互类型 | 时长 / 弹簧参数 | 缓动曲线 | 降级行为 (`prefers-reduced-motion`) |
|---|---|---|---|
| 按钮按下反馈 (`active`) | `170ms` (`transform`) | `cubic-bezier(0.22, 1, 0.36, 1)` | 缩放 `0.96`（主橙按钮 `0.98`）；禁用过渡 |
| Dock / 分段器水滴切换 (`layoutId`) | Spring `stiffness: 360, damping: 28, mass: 0.9` | 物理阻尼弹簧 | 传 `layoutId={undefined}` 即时切换 |
| 页面与阶段切换 | `200ms–300ms` | `[0.16, 1, 0.3, 1]` | `0.01s` 立即完成 |
| 阶段图片跨屏共享 (`warm-perf-stage-media`) | `380ms` | `[0.16, 1, 0.3, 1]` | 禁用共享形变 |
| 抽屉 / `setComplete` 面板弹出 | `200ms–220ms` + `y: 28 → 0` | `[0.16, 1, 0.3, 1]` | 无位移瞬间出现 |
| 进入组间休息背景降亮 | `500ms` | `ease-out` | `brightness` 与 `opacity` 直接生效 |
| 首页 Hero 视差 | 实时跟随 `scrollY`（`0.26x`, 最大 `96px`, 缩放最大 `1.07x`） | 线性滚动驱动 | 固定 `y=0, scale=1` |

---

## 8. 图标系统映射（`lucide-react` → SF Symbols）

Warm Performance 全量组件仅使用以下 16 个线性图标（统一 `1.75–2.25` 线宽）：

| Lucide 图标 | 界面语义 | 推荐 iOS SF Symbol |
|---|---|---|
| `Compass` | 底部导航「今日」 | `safari` / `safari.fill` |
| `Layers` | 底部导航「档案」 | `square.stack.3d.up` / `.fill` |
| `Play` | 开练、继续跟练、保存并开练 | `play.fill` |
| `Pause` | 暂停训练 | `pause.fill` |
| `Check` | 完成本动作、选中计划/配重打勾 | `checkmark` |
| `ChevronLeft` | 返回、上一动作、退出 | `chevron.left` |
| `ChevronRight` | 下一动作、查看详情箭头 | `chevron.right` |
| `SlidersHorizontal` | 配重与休息设定 | `slider.horizontal.3` |
| `AlertCircle` | 塑料杆安全警示提示 | `exclamationmark.circle` |
| `SkipBack` | 切换上一动作 | `backward.end.fill` |
| `SkipForward` | 跳过当前动作 | `forward.end.fill` |
| `Volume2` / `VolumeX` | 语音/原声开关 | `speaker.wave.2.fill` / `speaker.slash.fill` |
| `RotateCcw` | 次数重置回目标值、视频重播 | `arrow.counterclockwise` |
| `Calendar` | 档案月历切换 | `calendar` |
| `Film` | 暂无示范视频占位图标 | `film` |
| `X` | 关闭设定抽屉 | `xmark` |
