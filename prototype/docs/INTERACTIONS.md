# INTERACTIONS.md — 交互规则与训练状态机说明

> 本文档完整对应 `src/hooks/workoutStateMachine.ts`、`src/hooks/useWorkoutSimulator.ts` 与 `src/components/warm-performance/*` 的实际运行逻辑，明确标明**已真实实现交互**与**原型 Mock / 调试模拟边界**。

---

## 1. 全局状态模型

### 1.1 应用外壳状态（`WarmAppShell.tsx`）
- `activeScreen`: `'today' | 'history'`（底部 Dock 一级分页）
- `inspectedIdx`: `number | null`（`today` 页点按动作后打开的全屏动作详情索引；非 `null` 时隐藏底部 Dock）
- `selectedHistoryId`: `string | null`（`history` 页选中的单次实录 ID；非 `null` 时渲染单次详情）
- `historyRecords`: `HistorySessionRecord[]`（初始载入 `INITIAL_HISTORY_SESSIONS`，每次真实完成/提前结束非预览训练自动头插新增）
- `justArchivedId`: `string | null`（刚收入档案的记录 ID，用于在档案列表首卡呈现橙框高亮与提示语）

### 1.2 训练状态机阶段（`WorkoutPhase`）
`phase: 'today' | 'prepare' | 'active' | 'setComplete' | 'rest' | 'nextTransition' | 'summary'`

叠加控制标记：
- `isPaused`: `boolean`（暂停态独立冻结计时并弹出暂停遮罩）
- `showExitConfirm`: `boolean`（退出二次确认底部抽屉）
- `isDebugPreviewMode`: `boolean`（仅桌面评测工具跳阶段时置 `true`，防止测试预览污染真实训练档案）

---

## 2. 训练核心状态流转图

```
[today]
  │ startPreparation()
  ▼
[prepare] ──(4s 倒计时归零 / 点击「我已就位，立即开始」)──▶ [active]
                                                            │
         ┌─── 左侧单侧完成 (isUnilateral && side=='left') ───┤  handleCompleteActiveSet()
         │    (原地切换 currentSide='right'，重置次数/计时)   │
         │                                                  ▼
         │◀──────────────────────────────────────── [当前侧/双侧完成]
                                                            │
                        ┌── 最后一轮最后一个动作 ──────────────┤
                        │                                   ▼
                        │                         [setComplete] (4s 自动推进倒数)
                        │                           │  ▲ 微调次数/主观感受 → autoAdvancePaused=true
                        │                           ▼  └─ 手动点击「立即进入休息」
                        │                         [rest]
                        │                           │  -15s / +15s / countdown==0 / 提前结束休息
                        │                           ├── (restAutoAdvance==false) → restWaitingManual=true (等待点「开始下一动作」)
                        │                           ▼
                        │                    resolveAdvanceAfterRestOrSkip()
                        │                      ├─ 仍有后续动作 → [nextTransition] (2s) → [active]
                        ▼                      └─ 全课程结束 ──┐
                    [summary] ◀───────────────────────────────┘
                        ▲
                        └── 随时 via exitWorkoutEarly()（来自暂停页或退出抽屉）
```

---

## 3. 核心业务规则（SwiftUI 移植必守原则）

### 3.1 单侧动作（`isUnilateral === true`）规则
目前包含：`俯身单臂哑铃划船`、`跪姿胸椎旋转伸展`。
1. 进入动作默认先练 **左侧 (`left`)**。
2. 点击「完成左侧 (X 次) · 切右侧」时：
   - 立即记录 1 条 `LoggedSet`（`side: 'left'`, `actualRestSeconds: 0`）。
   - **不进入组间休息**，原地切至 `currentSide = 'right'`，重置 `repDraft` 为 `targetReps`、`currentSetStartedAt` 为当前时刻，并播报「左侧完成，请换右侧」。
3. 也可点击底部左侧「左侧 / 右侧」分段开关手动切侧。
4. 完成 **右侧 (`right`)** 时：记录 `LoggedSet`（`side: 'right'`），再进入 `setComplete → rest`（或直接进入 `summary`）。

### 3.2 `setComplete` 自动推进与交互打断
- 完成一组进入 `setComplete` 后，启动 `4s` 自动倒数（`setCompleteAutoSec`）准备滑入休息。
- **用户微调打断规则**：只要用户点击次数 `−`/`+` 或点击任一主观感受（`轻松` / `正好` / `吃力`），立即设置 `autoAdvancePaused = true`，停止自动倒数以免在编辑途中画面跳走；此后需点击实色橙按钮「进入组间休息」手动推进。
- 注意：若在 `active` 阶段改过次数且按 `handleCompleteActiveSet`，默认先以 `'正好'` 入库；在 `setComplete` 阶段修改的是 `loggedSets` 最后一条已记录的数据。

### 3.3 真实休息时长回写（`actualRestSeconds`）
- 只有通过 `handleCompleteActiveSet()` 正常完成一组进入的休息（`restTriggeredBySet === true`），每秒递增 `actualRestElapsed` 并实时同步更新到**上一条 `LoggedSet.actualRestSeconds`**。
- 若通过「跳过动作」推进或原型预览直接进入 `rest`，`restTriggeredBySet = false`，绝不伪造上一组的休息时长。

### 3.4 跳过动作 vs 上一动作
- **跳过动作 (`skipCurrentExercise`)**：不记录 `LoggedSet`，写入一条 `SkippedRecord`（轮次、动作序号、名称、时间），**不经过休息直接调用 `resolveAdvanceAfterRestOrSkip(..., viaSkip=true)`**：
  - 若后面还有动作：切入下一个动作 `nextTransition`。
  - 若已是最后一轮最后一个动作：直接完结至 `summary`，结局判定规则：`loggedSets.length === 0 ? 'early_exit_zero' : 'early_exit_partial'`（只要有过跳过且有实录即归为 `early_exit_partial`，绝不标记为完整完成 `completed`）。
- **上一动作 (`goToPrevExercise`)**：在 `active` 阶段点击时，退回上一动作（若为本轮第 1 个则退至上一轮最后一个动作），同步重置其 `repDraft` 与默认侧。

### 3.5 提前退出与 0 组隔离
- 点击左上角「退出」唤起确认抽屉，或在暂停页点击「提前结束训练」。
- `resolveEarlyExitOutcome`：
  - `loggedSets.length === 0` → `early_exit_zero`（收入档案但标明 0 组、不计入档案「有效训练次数」和累计分钟，月历灰底显示）。
  - `loggedSets.length > 0` → `early_exit_partial`（保留已做组实录并计入有效训练，月历橙框标注为部分完成）。

### 3.6 归档写入时机（防重复防预览污染）
- 在 `WarmAppShell` 的 `useEffect` 中监听：当 `sim.phase === 'summary'` 且 `!sim.isDebugPreviewMode` 且 `sim.sessionOutcome !== 'in_progress'`，且通过 `recordedStartRef` 确认同一场训练 (`sessionStartedAt`) 尚未写入过，才生成 `HistorySessionRecord` (`isDemoData: false`) 并插入 `historyRecords` 顶部，同时设 `justArchivedId`。
- 点击总结页底部 `收入个人训练档案` 后，调用 `sim.selectPlan(sim.planIndex)` 重置播放器回 `today` 并切至 `history` 列表。

---

## 4. 计时、音频、视频与动效细节

### 4.1 计时器行为（SwiftUI 移植重要差异点）
- **Web 原型现状**：单 `window.setInterval(..., 1000)` 驱动：
  - `isPaused === true` 时仅累加 `pausedSeconds`；
  - `phase !== 'prepare'` 时累加 `elapsedSeconds`；
  - 分相递减 `prepareRemaining`、`setCompleteAutoSec`、`restRemaining`（同时加 `actualRestElapsed`）、`transitionSec`。
- **iOS 原生改进要求**：Web 版在浏览器切后台时 `setInterval` 会被节流；**SwiftUI 版必须以 `Date()` 时间戳差值（或后台 Timer / BackgroundTask / Live Activity）计算真实经过秒数**，不可直接依赖 `1s` 计数累加。

### 4.2 音频提示与语音合成（`soundEnabled`）
- 提示音（Web Audio API 正弦短音 `playSubtleTone`）：
  - `prepare` 最后 `3, 2, 1` 秒：`540Hz 70ms`；归零开练：`880Hz 130ms`。
  - `active` 点击完成一组：`720Hz 100ms`；切回下一动作开练：`780Hz 100ms`。
  - `rest` 最后 `3, 2, 1` 秒：`540Hz 70ms`；休息归零：`880Hz 160ms`。
- 语音播报（Web Speech API `zh-CN`, rate `1.05`, volume `0.7`）：
  - `prepare` 结束：`开始，{动作名}`
  - 单侧切换：`左侧完成，请换右侧`
  - 全场完成：`全部轮次已完成，辛苦了`
  - 休息结束：`休息结束，准备{下一动作名}`
- **SwiftUI 映射**：对应 `AVAudioSession`（支持混音不打断用户后台音乐 `.mixWithOthers`）+ `AVSpeechSynthesizer` + 系统提示音效 + `UIImpactFeedbackGenerator`（Web 端无法触发真机马达震动，iOS 端应在完成组、调节次数与倒计时归零时补齐 Haptics）。

### 4.3 动作示范媒体与视频控件
- 默认无真实动作 MP4（使用经过核验的高清姿态图）。
- 当开启原型工具栏「注入测试视频」时，仅 `ex-floor-press` 和 `ex-single-row` 加载 `/videos/test-demo-1.mp4` 与 `/videos/test-demo-2.mp4`：
  - 自动循环静音播放；`isPaused` 或进入 `rest` 时自动 `pause()`，恢复 `active` 时自动 `play()`。
  - 若视频加载出错（`onError`），自动置 `videoLoadFailed = true` 回退至高清姿态图。
  - 仅在 `hasRealVideo === true` 时渲染「重播」与「已静音 / 原声」玻璃按钮。

---

## 5. 所有可点击控件响应清点（真实功能 vs Mock 标注）

| 界面 / 控件 | 交互响应 | 性质归类 |
|---|---|---|
| 顶部导航外层「注入测试视频 / 减弱透明 / 机型切换 / 阶段跳转」 | 实时控制播放器视频流、全局 CSS 透明降级类、外框尺寸与调试阶段 | 原型评测控制台（不进 SwiftUI） |
| 首页 `开始今日训练` / Dock `开练` / 详情 `进入全屏跟练` | 初始化一场完整训练并进入 `4s prepare` 倒计时 | **已真实实现** |
| 首页 `配重设定 / 配重与休息 / 歇Xs` | 打开并操作底部配重与休息抽屉（10 档预设、4 档休息、自动/手动切换） | **已真实实现**（硬件承重数值为待确认示例） |
| 首页 `今日顺延一天` / `恢复今日训练` / `改做恢复日` | 切换首页顺延态卡片、恢复训练或直接切换至恢复课程 | **已真实实现**（顺延状态仅存内存） |
| 首页 4 套方案切换卡 | 切换 `strength-a / strength-b / cardio / recovery`，重置课程默认休息与片重 | **已真实实现**（课程数据为前端静态配置） |
| 首页动作列表卡 | 打开全屏 `WarmExerciseDetailView` 并定位至对应动作索引 | **已真实实现** |
| 详情页 `‹` / `›` 与 `‹ 今日` | 切换动作索引、拆解节奏与配重文案，或返回首页 | **已真实实现** |
| 播放器右上角音量图标 | 实时开关所有短音与语音播报 | **已真实实现** |
| 播放器右侧步进器 `+` / 数字复位 / `−` | 实时增减本次实做次数或恢复 `targetReps` | **已真实实现** |
| 播放器左下单侧切换 `左侧 / 右侧` | 手动或完成左侧后自动切换发力侧 | **已真实实现** |
| 播放器实色橙主按钮 `完成本动作` | 记录真实 `LoggedSet`（含时间戳与次/秒），并按状态机推进 | **已真实实现** |
| 播放器辅控栏 `上一动作 / 暂停 / 跳过动作` | 回退动作、冻结计时弹出暂停遮罩、记录跳过并推进 | **已真实实现** |
| 休息阶段 `-15s / +15s / 提前结束休息 / 开始下一动作` | 动态调整剩余与目标休息时间（最低 5s），或立刻跳转 | **已真实实现** |
| 总结页 `收入个人训练档案` | 重置训练器并跳转档案页，首卡高亮展示刚刚完成的实录 | **已真实实现**（内存持久化，刷新清空） |
| 档案页 `记录 / 月历` 与 `全部 / 力量 / 有氧 / 恢复` | `layoutId` 光学滑块切换视图与过滤数据集；点击月历高亮日直达单次详情 | **已真实实现**（月历固定 `2026年11月` 为 Mock） |
| 档案列表项 & 单次详情 `‹ 档案` | 展开/关闭单次训练详情，完整读取逐轮实录与跳过清单 | **已真实实现**（初始 5 条含 `isDemoData: true` 样本） |
