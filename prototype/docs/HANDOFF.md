# HANDOFF.md — 面向 Codex 的 SwiftUI 原生开发交接指南

> **重要版本声明**：  
> 当前仓库已确定以 **Warm Performance（暖光运动）+ Liquid Glass** 作为唯一冻结设计基线。  
> 本 `docs/` 目录下的 6 份文档（`DESIGN_SYSTEM.md`、`SCREEN_SPEC.md`、`INTERACTIONS.md`、`COMPONENTS.md`、`ASSETS.md`、`HANDOFF.md`）**完全取代**仓库根目录遗留的早期文档 `DESIGN_HANDOFF_CODEX.md`（该旧文档描述的是已淘汰的暗黑 B1.5 `#08090B` + `#C8F542` 探索稿）。

---

## 1. 项目技术栈与运行方式

- **原型技术栈**：React 19 + TypeScript + Vite 8 + Tailwind CSS v4 (`@tailwindcss/vite`) + Motion (`motion/react`) + `lucide-react`
- **Node 依赖安装与运行命令**（在项目根目录执行）：
  ```bash
  npm install
  npm run dev     # 启动本地开发预览服务器，固定端口 http://localhost:3000
  npm run lint    # 执行 TypeScript 类型与语法全量校验 (tsc --noEmit)
  npm run build   # 编译生产包输出至 dist/
  ```
- **安全与隐私检查**：本工程纯前端运行，**不包含**后端密钥、API Token、真实用户隐私账号数据或本地机器绝对路径。唯一保留的 `.env.example` 为占位模板，无需配置即可完整运行。

---

## 2. 仓库目录与文件边界（哪些必须移植 vs 哪些须忽略）

```
.
├── docs/                                # [交接核心] 给 Codex 的 6 份工程与设计规格文档
├── public/videos/
│   ├── test-demo-1.mp4                  # 仅用于调试「注入测试视频」的占位流
│   └── test-demo-2.mp4
├── src/
│   ├── App.tsx                          # [桌面对比外壳 - 不移植] 包含 10 种历史探索切换器与机型框
│   ├── index.css                        # [设计核心] 字体定义与 Warm Performance Liquid Glass 样式表
│   ├── types/design.ts                  # [逻辑核心] TS 类型定义（SwiftUI Data Model 蓝本）
│   ├── data/
│   │   ├── workouts.ts                  # 4 套课程结构、10 档哑铃装片计算与安全提示文案
│   │   └── appRecords.ts                # 初始历史训练档案样本（5 条 Demo）
│   ├── hooks/
│   │   ├── workoutStateMachine.ts       # [逻辑核心] 纯函数训练推进、结局、单侧切换判定
│   │   └── useWorkoutSimulator.ts       # [逻辑核心] 完整计时器、音频、视频、记录状态管理器
│   ├── assets/images/                   # 57 张本地 JPEG 素材（仅 13 张用于 Warm Performance）
│   └── components/
│       ├── WarmPerformanceWorkspace.tsx # [桌面对比外壳 - 不移植] 双课并排验视台与规范卡片
│       ├── IPhoneFrame.tsx              # [桌面对比外壳 - 不移植] 模拟真机外框与 07:42 假状态栏
│       └── warm-performance/            # [iOS 正式 App 1:1 蓝本] 必须完整移植至 SwiftUI
│           ├── warmTokens.ts            # 色彩/文字/Scrim/摄影滤镜与媒体映射表
│           ├── WarmGlass.tsx            # 6 个统一 Liquid Glass 原语组件
│           ├── WarmAppShell.tsx         # App 根路由容器、3-Tab Dock 导航与自动归档监听
│           ├── WarmTodayView.tsx        # 今日首页 + 吸顶变态 + 配重与休息设定抽屉
│           ├── WarmExerciseDetailView.tsx # 连续转场动作详情页 + 节奏拆解
│           ├── WarmPlayerView.tsx       # 全屏训练舞台 + Prepare/Rest/SetComplete/Pause/Exit/Summary
│           └── WarmHistoryView.tsx      # 训练档案列表 + 月历视图 + 单次详情
└── [历史淘汰目录 - 不移植]
    ├── src/components/app/              # 早期 Phase 1 4-Tab 原型
    ├── src/components/cinematic/        # 早期暮色暗黑探索
    ├── src/components/cinematic-polished/ # 精修暗色方案（仅被借用了 formatTempoExplanation 辅助函数）
    ├── src/components/liquid/           # 早期深色 B1.5 实验玻璃原语
    ├── src/components/mood-explorations/ # 日光/清透/质感对比实验
    └── src/components/prototypes/       # 早期布局探索原型
```

> **提示**：`WarmExerciseDetailView.tsx` 第 5 行引用了一个纯工具函数 `formatTempoExplanation`（来自 `../cinematic-polished/polishedMedia`），SwiftUI 实现时直接把节奏说明文案规则内联到动作模型方法即可，无需移植其余 `cinematic-polished` 代码。

---

## 3. 功能实现状态总览（已实现 vs Mock vs 未实现）

### 3.1 已真实实现的可运行原型逻辑（可直接按 `src/hooks/` 1:1 翻译为 Swift）
1. **7 阶段训练状态机**：`today` → `prepare (4s)` → `active` → `setComplete (4s)` → `rest (动作间/轮间)` → `nextTransition (2s)` → `summary`。
2. **单侧交替训练规则**：左侧完成后原地切右侧（不进休息、提示语音），右侧完成才进 `setComplete`。
3. **动态次数修改 & `setComplete` 编辑**：支持执行中右缘步进（可复位 `targetReps`），也支持完成组后 4 秒窗内修改实际次数与主观感受（点击微调自动暂停 4 秒自动跳转）。
4. **休息调整与推进模式**：实时 `-15s / +15s`（下限 `5s`），记录真实已休秒数 `actualRestSeconds` 回写到上一组，支持「自动推进」或「手动确认 (`就绪`)」。
5. **诚实的统计与边界规则**：跳过动作记录 `SkippedRecord` 且不造假完成组、不给上一组记休息；0 组提前退出标为 `early_exit_zero` 且不计入档案有效次数；预览调试态 (`isDebugPreviewMode`) 绝不写入历史档案。
6. **配重装片组合数学模型**：严格基于用户 `1.25 / 1.5 / 2.0 / 2.5 kg` 各 4 片库存派生出 10 档均分装片方案，明确分离「已知片重」与「未知空杆重/安全提示」。
7. **档案列表、分类过滤与新纪录高亮**：支持全部/力量/有氧/恢复过滤，完成训练收入档案后首卡触发高亮提示并支持进入单次详情。
8. **多媒体与无障碍响应**：HTML5 `<video>` 循环/静音/重播/失败自动降级静态图；Web Audio + Web Speech 中文语音播报；系统/开关级 `prefers-reduced-transparency` 与 `prefers-reduced-motion` 支持。

### 3.2 明确标注为 Mock / 演示占位的数据与 UI
- **课程列表（`WORKOUT_OPTIONS`）**：前端静态数组（力量 A、力量 B、有氧、恢复日），暂无云端或用户自定义编辑课程。
- **历史初始记录（`INITIAL_HISTORY_SESSIONS`）**：5 条带 `isDemoData: true` 的 2026 年 11 月示例记录。
- **首页顶部周期角标**：硬编码文本 `'第 9 周 · 居家哑铃'`（`WarmTodayView.tsx:108`）。
- **档案月历网格**：`WarmHistoryView.tsx` 硬编码渲染 **2026 年 11 月**（30 天，周起始占位 6 格），非动态月份选择器。
- **状态栏时间**：`IPhoneFrame.tsx` 固定展示 `07:42`（桌面框装饰，真机由 iOS 系统接管）。
- **测试视频流**：仅 `ex-floor-press` 与 `ex-single-row` 在手动开启「注入测试视频」时加载本地 `test-demo-1/2.mp4`。
- **数据存储**：仅存 React `useState` 内存态，浏览器刷新即还原。

### 3.3 正式 iPhone App 尚待实现事项（Codex 后续开发清单）
1. **原生持久化（SwiftData / CoreData）**：持久化训练实录 `HistorySessionRecord`、用户休息偏好、默认装片选择、实际确认后的「空杆重量与塑料杆安全承重参数」，以及「今日顺延」记录。
2. **动态真实日历**：档案页月历须支持按真实系统年月生成、左右切月，并支持同一天多次训练展示与筛选联动。
3. **基于真实时间戳的后台计时**：使用 `Date.now()` / `mach_continuous_time()` 计算真实耗时与倒计时，避免切后台/锁屏计时飘移；建议接入 **Live Activities（灵动岛倒计时）** 与 **本地通知**（组间休息结束提醒）。
4. **触觉反馈与原生音频会话**：补全 `UIImpactFeedbackGenerator`（完成组、步进、倒数结束）与 `AVAudioSession(.playback, options: [.mixWithOthers])` 不打断音乐的语音播报。
5. **真实动作示范资产**：补齐 14 个动作的 `9:16` 实拍示范视频与 `ex-rdl` / `ex-lateral-raise` 专属姿态图。
6. **HealthKit 可选集成**：如后续需要记录体能训练 (`HKWorkoutSession`) 与心率，需独立申请权限并配置隐私声明。
7. **未知硬件参数首次引导/设定**：允许用户实测并录入自家哑铃空杆重与单杆安全上限，替换「未知杆」占位文案。

---

## 4. 已知问题与设计注意事项

1. **Web 跨页切换的 Legacy 模块残留**：`App.tsx` 仍保留了 `mood_trio`、`cinematic`、`phase1_app`、`baseline` 等历史对比模式及它们引用的 `/src/assets/images/` 字面路径（供 `vite dev` 对照查看）。SwiftUI 新工程请只参考 `src/components/warm-performance/*` 与 `src/hooks/*`。
2. **不要全屏玻璃化**：移植时切忌把 `WarmTodayView` 或 `WarmHistoryView` 的主文字流做成玻璃背景，**只允许**在 `WarmGlass.tsx` 列出的 6 类浮层与卡片容器使用 Liquid Glass（iOS 26 原生 `.glassEffect()` 或 iOS 18 `.ultraThinMaterial` 回退），且所有主要高意向行动按钮（开始训练、完成本动作、继续跟练、收入档案）必须维持实心 `#D44E24` 暖橙色。
3. **降亮舞台玻璃极性切换**：在 `prepare / rest / nextTransition / setComplete` 舞台降亮阶段，顶部胶囊和 `-15s / +15s` **必须使用深烟熏玻璃**配 `#F9F7F3` 浅字（对应 `.warm-lg-dim-control`），切勿沿用白透玻璃以免在日光白墙摄影背景下字迹消失。

---

## 5. 导出完整源码 ZIP 包方式

请勿在 ZIP 中包含 `node_modules/`、`dist/` 或任何本地构建产物（以及不要直接将本 Web 页面用 WKWebView/Capacitor 套壳上架 iOS）。

在项目根目录运行以下命令即可生成干净、可独立 `npm install && npm run dev` 运行的完整交付包（含全部源码、`src/assets/`、`public/videos/`、`docs/` 与工程配置）：

```bash
# 方式 1：使用 zip 打包（推荐，兼容非 Git 环境）
zip -r genlian-warm-performance-handoff.zip . \
  -x "node_modules/*" "dist/*" "build/*" ".git/*" ".DS_Store" "*.log" ".env" ".env.local"

# 方式 2：若仓库已初始化 Git，可直接导出当前工作区跟踪文件
git archive --format=zip --output=../genlian-warm-performance-handoff.zip HEAD
```

解压检验步骤（确保零依赖缺失）：
```bash
unzip genlian-warm-performance-handoff.zip -d ./genlian-verify
cd ./genlian-verify
npm install && npm run lint && npm run build
```
