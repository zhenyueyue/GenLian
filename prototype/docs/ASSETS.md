# ASSETS.md — 静态资源与媒体资产清点

> **真实性声明**：本文档严格基于仓库磁盘实际文件清点，不虚构任何未拍摄或未包含的真实视频/照片资产。

---

## 1. 静态图片资源（`src/assets/images/`，总计 57 个 `.jpg` 文件）

> **重要工程处理说明**：原型的 `warmTokens.ts` 已在交付整理阶段将 Warm Performance 正式基线所使用的 **13 张图片**全部改造为 Vite 静态 ES Module 导入（`import ... from '../../assets/images/...'`），执行 `npm run build` 时已验证全部 13 张正式基线图片正确打包至 `dist/assets/`。

### 1.1 Warm Performance 正式基线实际使用的图片（共 13 张，需打包进 iOS `Assets.xcassets`）

| 文件名（位于 `src/assets/images/`） | 对应动作 / 课程 ID | 角色与构图说明 | iOS 裁切与呈现标记 |
|---|---|---|---|
| `mood_a_wide_floor_press_1794682426679.jpg` | `strength-a` 封面、`ex-floor-press` 横图、`ex-floor-press-cardio` 横图、`hist-04`/`05` 归档图 | 晨光地板卧推横幅场景 | `object-cover` |
| `mood_a_player_floor_press_1794682423173.jpg` | `strength-a` 首页 Hero、`ex-floor-press` 竖屏舞台/详情图 | 地板卧推竖幅全身姿态 | Hero `object-[50%_48%]`；舞台 `object-[50%_54%]`；详情 `detailContain: true` |
| `mood_a_wide_single_row_1794682426537.jpg` | `ex-single-row` 横图、`ex-rdl` 横图（复用） | 单臂俯身划船横幅 | 详情 `detailContain: true` |
| `mood_a_player_single_row_1794682425212.jpg` | `ex-single-row` 竖屏舞台/详情、`ex-rdl` 竖屏舞台（暂代） | 单臂划船竖幅姿态 | `focalClass: object-[50%_46%]`；`detailContain: true` |
| `editorial_goblet_squat_1794674655868.jpg` | `ex-goblet-squat` 横图与竖屏舞台/详情 | 高脚杯哑铃深蹲（含哑铃全貌） | `wideContain: true`, `detailContain: true`（不裁切头部与足底） |
| `editorial_dead_bug_v2_1794674675456.jpg` | `ex-dead-bug` / `ex-dead-bug-b` / `ex-core-cardio` / `ex-dead-bug-rec` 横图 | 仰卧死虫式横幅垫上姿态 | `wideFocalClass: object-[50%_62%]` |
| `mood_a_player_dead_bug_1794682424533.jpg` | 上述全部死虫式变体竖屏舞台/详情 | 死虫式竖幅 | `focalClass: object-[50%_52%]`, `detailContain: true` |
| `warm_cardio_squat_hero_1794683842233.jpg` | `cardio` 首页 Hero、`ex-goblet-cardio` 横图与竖屏舞台 | 轻负重有氧深蹲动态抓拍 | `wideContain: true`, `detailContain: true` |
| `warm_cardio_row_wide_1794683843128.jpg` | `cardio` 课程切换卡 / `hist-01` 归档图、`ex-row-cardio` 横图 | 轻负重有氧划船横幅 | `object-cover` |
| `editorial_single_row_1794674654582.jpg` | `ex-row-cardio` 竖屏舞台/详情 | 有氧单臂划船竖幅 | `focalClass: object-[50%_48%]`, `detailContain: true` |
| `editorial_floor_press_1794674653915.jpg` | `ex-floor-press-cardio` 竖屏舞台/详情 | 有氧卧推竖幅 | `focalClass: object-[50%_54%]`, `detailContain: true` |
| `mood_a_wide_shoulder_1794682427190.jpg` | `strength-b` Hero/封面、`hist-02` 归档图、`ex-shoulder-press` / `ex-lateral-raise` | 肩背推举日晨光横幅 | 舞台 `playerContain: true`, 详情 `detailContain: true` |
| `mood_a_wide_recovery_1794682427795.jpg` | `recovery` Hero/封面、`hist-03` 归档图、`ex-thoracic` | 恢复日舒展横幅 | 舞台 `playerContain: true`, 详情 `detailContain: true` |

> **素材复用与缺口提示**：
> - `ex-rdl`（哑铃罗马尼亚硬拉）目前在 `warmTokens.ts` 中暂复用 `WARM_SINGLE_ROW` 图片；
> - `ex-lateral-raise`（控制式哑铃侧平举）暂复用 `WARM_SHOULDER` 图片；
> - 正式 App 制作阶段建议为这两个动作单独补拍匹配动作姿态图/视频。

### 1.2 仅用于历史对照方案与早期探索的冗余图片（共 44 张，iOS 正式工程**不需要**迁入）
保留在仓库内以维持桌面端「原案留存 / 方案对比」模式可运行：
- `cinema_*`（4 张）：`cinema_hero_strength_a_1794679401192.jpg`, `cinema_still_cardio_1794679401520.jpg`, `cinema_still_recovery_1794679401997.jpg`, `cinema_still_strength_b_1794679401973.jpg`
- `demo_*`（5 张）：`demo_dead_bug_core_1794667632709.jpg`, `demo_floor_press_1794667630997.jpg`, `demo_goblet_squat_1794667631118.jpg`, `demo_rdl_hinge_1794667632342.jpg`, `demo_stretch_thoracic_1794667632681.jpg`
- `editorial_*` 未使用项（1 张）：`editorial_dead_bug_1794674657337.jpg`
- `mood_a_player_goblet_squat_1794682424502.jpg`（1 张，被 `moodThemes.ts` 引用）
- `mood_b_*`（2 张）：`mood_b_player_floor_press_1794682428342.jpg`, `mood_b_player_single_row_1794682429363.jpg`
- `mood_c_*`（2 张）：`mood_c_player_dead_bug_1794682434923.jpg`, `mood_c_player_goblet_squat_1794682435233.jpg`
- `polish_*`（17 张）：`polish_hero_strength_a_1794679877668.jpg`, `polish_player_*`（8 张）, `polish_still_*`（3 张）, `polish_wide_*`（5 张）
- `precision_*`（5 张）：`precision_dead_bug_1794674661034.jpg`, `precision_dead_bug_v2_1794674676159.jpg`, `precision_floor_press_1794674657653.jpg`, `precision_goblet_squat_1794674659754.jpg`, `precision_single_row_1794674659174.jpg`
- `vert_*`（4 张）：`vert_dead_bug_1794668882164.jpg`, `vert_floor_press_1794668881244.jpg`, `vert_goblet_squat_1794668881647.jpg`, `vert_single_row_1794668881142.jpg`
- `workout_*`（3 张）：`workout_press_minimal_1794666142530.jpg`, `workout_row_dynamic_1794666142762.jpg`, `workout_sculpt_editorial_1794666145424.jpg`

---

## 2. 视频资源（`public/videos/`）

| 文件路径 | 用途 | 真实状态标注 |
|---|---|---|
| `public/videos/test-demo-1.mp4` | `ex-floor-press` 测试视频流 | **Mock / 原型测试视频**：仅当点击工具栏「注入测试视频」时启用，用于验证循环/重播/静音/暂停逻辑 |
| `public/videos/test-demo-2.mp4` | `ex-single-row` 测试视频流 | **Mock / 原型测试视频**：同上 |
| 其余 12 个动作视频 | 缺失 | **尚未提供实拍视频**：正式 App 需补拍 `9:16` 循环示范 MP4，否则展示经核验静态姿态参考或占位视图 |

---

## 3. 字体资源（`index.html` Google Fonts CDN）

当前通过 Google Fonts `<link>` 在线加载以下家族（`Warm Performance` 仅实际依赖前 4 个）：
- **Warm Performance 实际使用**：
  - `Outfit` (`500, 600, 700, 800`) — 计时器与核心度量数字 (`.font-display-b`)
  - `Plus Jakarta Sans` (`400, 500, 600, 700`) — 英文与基础无衬线 UI
  - `Noto Sans SC` (`400, 500, 600, 700`) — Web 端中文无衬线回退（iOS 优先命中系统 `PingFang SC`）
  - `JetBrains Mono` (`400, 500, 600`) — 时间码、节奏、配重标签 (`.font-mono-num`)
- **历史方案对比加载（Warm Performance 未使用）**：`Barlow Condensed`, `Fraunces`, `IBM Plex Mono`, `Manrope`, `Noto Serif SC`。
- **iOS 原生授权与离线化提醒**：App Store 上线时若沿用 `Outfit` 与 `JetBrains Mono`，应从 SIL Open Font License (OFL) 官方发布源下载 `.ttf/.otf` 嵌入 Xcode Bundle 并在 `Info.plist` (`UIAppFonts`) 注册，或改用 Apple 系统内置 `SF Pro Rounded` + `SF Mono`（免版权与包体负担）。

---

## 4. 图标资源（`lucide-react` v0.546.0）

- 全部采用 SVG 矢量渲染（开源 ISC License）。
- Warm Performance 实际引用的 16 个图标名及 SF Symbols 对应关系已完整列于 `docs/DESIGN_SYSTEM.md` 第 8 节。

---

## 5. 授权与合规状态总表

| 资产类别 | 来源 | 商业授权状态 | 上线前动作 |
|---|---|---|---|
| 摄影 `.jpg`（57 张） | 原型内置设计素材 | **待确认 / 仅原型内置** | 若上架 App Store，须替换为自有实拍居家运动照片或取得明确商业授权 |
| 测试视频 `.mp4`（2 个） | 原型内置测试流 | **测试占位（仅演示播放器）** | 正式版本须拍摄并压制 14 个动作对应的 `9:16` H.264/HEVC MP4 |
| `Outfit` / `JetBrains Mono` / `Plus Jakarta Sans` | Google Fonts (SIL OFL 1.1) | 可商用（需保留字体声明） | 如离线使用需打包字体文件或切换系统 SF 字体 |
| `lucide-react` 图标 | npm 包 `lucide-react` (ISC) | 可商用，但 iOS 端建议直接使用 Apple 原生 SF Symbols | 替换对应 SF Symbols |
